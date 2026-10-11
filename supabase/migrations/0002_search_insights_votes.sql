-- Senior-Junior Connect, migration 2: semantic search, structured insights
-- and voting. Run after 0001_schema.sql, in the Supabase SQL editor or with
-- `supabase db push`.
--
-- Three features share one migration because they all hang off posts:
--   1. an embedding column so the assistant can retrieve by meaning
--   2. insight columns the model fills in from each write-up
--   3. votes, and the hot ranking the trending page orders by

-- ---------------------------------------------------------------------------
-- 1. pgvector
-- ---------------------------------------------------------------------------

-- Supabase puts this in the `extensions` schema; enabling it from the SQL
-- editor can put it in `public`. Either is fine, but the `vector` type and the
-- `vector_cosine_ops` operator class have to resolve from wherever it landed,
-- so both schemas go on the search_path for the rest of this script. Without
-- this line a project with pgvector in `extensions` fails at the first ALTER
-- TABLE below -- and because the SQL editor runs the file in one transaction,
-- that rolls the whole migration back and nothing is applied.
create extension if not exists vector;
set search_path = public, extensions;

-- ---------------------------------------------------------------------------
-- 2. Search and insight columns
--
--    `embedding` is the write-up as a vector. `insights` is the model's
--    reading of it, kept whole as jsonb for display; the few fields worth
--    filtering and charting are also stored as real columns.
--
--    None of these are member-writable: the column grants in section 8 leave
--    them out, and the app writes them through set_post_enrichment().
-- ---------------------------------------------------------------------------

alter table public.posts
  add column if not exists embedding vector(768),
  add column if not exists insights jsonb,
  add column if not exists topics text[] not null default '{}',
  add column if not exists difficulty int check (difficulty is null or difficulty between 1 and 5),
  add column if not exists round_count int check (round_count is null or round_count between 0 and 20),
  add column if not exists outcome text
    check (outcome is null or outcome in ('selected', 'rejected', 'in_progress', 'unknown')),
  add column if not exists enriched_at timestamptz;

-- Approximate nearest neighbour. Cosine distance, to match the normalised
-- embeddings the app sends.
create index if not exists posts_embedding_idx
  on public.posts using hnsw (embedding vector_cosine_ops);

create index if not exists posts_topics_idx on public.posts using gin (topics);
create index if not exists posts_difficulty_idx on public.posts (difficulty);

-- ---------------------------------------------------------------------------
-- 3. Votes
--
--    One row per member per experience. Downvotes are kept because they carry
--    the ranking signal, but members never read them: the select policy below
--    shows a member only their own row, and the aggregate columns a member is
--    granted (section 8) expose the net score alone. Upvotes and downvotes
--    separately are admin-only, through admin_vote_breakdown().
-- ---------------------------------------------------------------------------

create table if not exists public.post_votes (
  post_id uuid not null references public.posts (id) on delete cascade,
  voter_id uuid not null references public.profiles (id) on delete cascade,
  value smallint not null check (value in (-1, 1)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (post_id, voter_id)
);

create index if not exists post_votes_voter_idx on public.post_votes (voter_id);

drop trigger if exists post_votes_touch on public.post_votes;
create trigger post_votes_touch before update on public.post_votes
  for each row execute function public.touch_updated_at();

alter table public.posts
  add column if not exists upvotes int not null default 0,
  add column if not exists downvotes int not null default 0,
  add column if not exists score int not null default 0,
  add column if not exists hot double precision not null default 0;

-- ---------------------------------------------------------------------------
-- 4. Hot ranking
--
--    Reddit's ranking, with one correction: Reddit multiplies the time term by
--    sign(score), which collapses every unvoted post to exactly 0 and leaves
--    new posts in arbitrary order. Here the age term always counts and the
--    score shifts it, so an unvoted post still sorts by recency.
--
--    45000 seconds (12.5 hours) buys one unit of log10(score), so an
--    experience needs ten times the score to outrank one half a day newer.
--    The time term is absolute, not relative to now(), so a stored value never
--    goes stale: it only has to be recomputed when the score changes.
-- ---------------------------------------------------------------------------

create or replace function public.hot_rank(score int, created timestamptz)
returns double precision
language sql
immutable
as $$
  select sign(score)::double precision * log(greatest(abs(score), 1)::numeric)::double precision
       + extract(epoch from created) / 45000.0
$$;

create index if not exists posts_hot_idx on public.posts (hot desc);

-- Recount one experience from its votes. SECURITY DEFINER because members are
-- not granted update on these columns -- only this trigger writes them.
create or replace function public.refresh_post_votes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target uuid := coalesce(new.post_id, old.post_id);
  ups int;
  downs int;
begin
  select
    count(*) filter (where value = 1),
    count(*) filter (where value = -1)
  into ups, downs
  from public.post_votes
  where post_id = target;

  update public.posts
  set upvotes = ups,
      downvotes = downs,
      score = ups - downs,
      hot = public.hot_rank(ups - downs, created_at)
  where id = target;

  return null;
end;
$$;

drop trigger if exists post_votes_refresh on public.post_votes;
create trigger post_votes_refresh
  after insert or update or delete on public.post_votes
  for each row execute function public.refresh_post_votes();

-- A new experience starts with no votes, so its hot value is pure recency.
create or replace function public.seed_post_hot()
returns trigger
language plpgsql
as $$
begin
  new.hot := public.hot_rank(0, new.created_at);
  return new;
end;
$$;

drop trigger if exists posts_seed_hot on public.posts;
create trigger posts_seed_hot before insert on public.posts
  for each row execute function public.seed_post_hot();

update public.posts set hot = public.hot_rank(score, created_at) where hot = 0;

-- ---------------------------------------------------------------------------
-- 5. Semantic search
--
--    SECURITY DEFINER, because section 8 takes the embedding column away from
--    members: a function running as the caller could not read the very column
--    it has to compare against. It returns ids and similarities only, never a
--    vector, and refuses an anonymous caller -- which together give the same
--    reach as the posts policy, where every signed-in member may read every
--    experience.
--
--    The embedding arrives as text and is cast here: PostgREST has no JSON
--    representation for a vector.
-- ---------------------------------------------------------------------------

create or replace function public.match_posts(
  query_embedding text,
  match_count int default 8,
  min_similarity double precision default 0.25
)
returns table (id uuid, similarity double precision)
language plpgsql
stable
security definer
set search_path = public, extensions
as $$
declare
  query_vector vector(768) := query_embedding::vector(768);
begin
  if auth.uid() is null then
    return;
  end if;
  return query
    select p.id, (1 - (p.embedding <=> query_vector))::double precision as similarity
    from public.posts p
    where p.embedding is not null
      and (1 - (p.embedding <=> query_vector)) >= min_similarity
    order by p.embedding <=> query_vector
    limit greatest(match_count, 1);
end;
$$;

-- ---------------------------------------------------------------------------
-- 6. Writing enrichment back
--
--    The app has no service-role key, so this runs as definer and checks the
--    caller itself: the author of the experience, or an administrator running
--    a backfill.
-- ---------------------------------------------------------------------------

create or replace function public.set_post_enrichment(
  target uuid,
  new_embedding text default null,
  new_insights jsonb default null,
  new_topics text[] default null,
  new_difficulty int default null,
  new_round_count int default null,
  new_outcome text default null
)
returns void
language plpgsql
security definer
-- `extensions` is needed for the ::vector(768) cast below.
set search_path = public, extensions
as $$
declare
  owner uuid;
begin
  select author_id into owner from public.posts where id = target;
  if owner is null then
    raise exception 'That experience does not exist.';
  end if;
  if auth.uid() is not null and auth.uid() <> owner and not public.is_admin() then
    raise exception 'You can only enrich your own experience.';
  end if;
  if new_outcome is not null and new_outcome not in ('selected', 'rejected', 'in_progress', 'unknown') then
    raise exception 'Unknown outcome.';
  end if;

  update public.posts
  set embedding   = coalesce(new_embedding::vector(768), embedding),
      insights    = coalesce(new_insights, insights),
      topics      = coalesce(new_topics, topics),
      difficulty  = coalesce(new_difficulty, difficulty),
      round_count = coalesce(new_round_count, round_count),
      outcome     = coalesce(new_outcome, outcome),
      enriched_at = now()
  where id = target;
end;
$$;

-- Experiences still waiting to be embedded or read, newest first. Used by the
-- admin backfill. Admin-only: it reports on rows across every author.
create or replace function public.posts_needing_enrichment(batch int default 5)
returns table (id uuid)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Only administrators can run the backfill.';
  end if;
  return query
    select p.id from public.posts p
    where p.embedding is null or p.insights is null
    order by p.created_at desc
    limit greatest(batch, 1);
end;
$$;

-- ---------------------------------------------------------------------------
-- 7. Admin view of the vote split
-- ---------------------------------------------------------------------------

create or replace function public.admin_vote_breakdown(limit_count int default 50)
returns table (
  id uuid,
  title text,
  company_or_exam text,
  upvotes int,
  downvotes int,
  score int,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Only administrators can see the vote split.';
  end if;
  return query
    select p.id, p.title, p.company_or_exam, p.upvotes, p.downvotes, p.score, p.created_at
    from public.posts p
    where p.downvotes > 0 or p.upvotes > 0
    order by p.downvotes desc, p.score asc
    limit greatest(limit_count, 1);
end;
$$;

-- ---------------------------------------------------------------------------
-- 8. Row Level Security and grants
-- ---------------------------------------------------------------------------

alter table public.post_votes enable row level security;

-- A member sees their own vote, and nobody else's. This is what keeps the
-- downvote count off the client even though the rows are there.
drop policy if exists "Members can see their own vote" on public.post_votes;
create policy "Members can see their own vote"
  on public.post_votes for select to authenticated
  using (voter_id = auth.uid() or public.is_admin());

-- No voting on your own experience: on a placement board that would just be
-- a way to push your own write-up up the trending page.
drop policy if exists "Verified members can vote" on public.post_votes;
create policy "Verified members can vote"
  on public.post_votes for insert to authenticated
  with check (
    voter_id = auth.uid()
    and public.is_verified_member()
    and auth.uid() <> (select author_id from public.posts where id = post_id)
  );

drop policy if exists "Members can change their vote" on public.post_votes;
create policy "Members can change their vote"
  on public.post_votes for update to authenticated
  using (voter_id = auth.uid() and public.is_verified_member())
  with check (
    voter_id = auth.uid()
    and auth.uid() <> (select author_id from public.posts where id = post_id)
  );

drop policy if exists "Members can take their vote back" on public.post_votes;
create policy "Members can take their vote back"
  on public.post_votes for delete to authenticated
  using (voter_id = auth.uid());

revoke all on public.post_votes from anon, authenticated;
grant select, delete on public.post_votes to authenticated;
grant insert (post_id, voter_id, value) on public.post_votes to authenticated;
-- An upsert rewrites every column it sends, so all three are listed. The
-- update policy above is what stops a member touching anyone else's vote.
grant update (post_id, voter_id, value) on public.post_votes to authenticated;

-- Posts: replace the blanket select grant from 0001 with a column list, so
-- three things stay server-side -- the embedding (768 floats nobody needs in
-- the browser), and the upvote and downvote counts, which together would give
-- away the hidden downvotes. Members get the net score only.
revoke select on public.posts from authenticated;
grant select (
  id, author_id, title, company_or_exam, description, category, role, branch,
  graduation_year, tags, created_at, updated_at,
  insights, topics, difficulty, round_count, outcome, enriched_at, score, hot
) on public.posts to authenticated;

revoke execute on function public.match_posts(text, int, double precision) from public, anon;
revoke execute on function public.set_post_enrichment(uuid, text, jsonb, text[], int, int, text) from public, anon;
revoke execute on function public.posts_needing_enrichment(int) from public, anon;
revoke execute on function public.admin_vote_breakdown(int) from public, anon;
grant execute on function public.match_posts(text, int, double precision) to authenticated;
grant execute on function public.set_post_enrichment(uuid, text, jsonb, text[], int, int, text) to authenticated;
grant execute on function public.posts_needing_enrichment(int) to authenticated;
grant execute on function public.admin_vote_breakdown(int) to authenticated;
