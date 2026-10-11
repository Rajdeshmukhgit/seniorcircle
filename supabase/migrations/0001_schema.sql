-- Senior-Junior Connect: schema, triggers and Row Level Security.
-- Run this once in the Supabase SQL editor (or with `supabase db push`).

-- ---------------------------------------------------------------------------
-- 0. Configuration
-- ---------------------------------------------------------------------------

-- The email domain students must sign up with (name@mitwpu.edu.in).
-- Keep it identical to the domain the app uses (lib/constants/site.ts).
create or replace function public.college_email_domain()
returns text
language sql
immutable
as $$ select 'mitwpu.edu.in'::text $$;

-- The graduating year of the current final-year batch. The academic year
-- turns over in July. Mirrors finalYearBatch() in lib/constants/options.ts.
create or replace function public.final_year_batch()
returns int
language sql
stable
as $$
  select case
    when extract(month from now()) >= 7 then extract(year from now())::int + 1
    else extract(year from now())::int
  end
$$;

-- ---------------------------------------------------------------------------
-- 1. Tables
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  role text not null check (role in ('junior', 'senior', 'alumni', 'admin')),
  verification_status text not null default 'not_required'
    check (verification_status in ('not_required', 'pending', 'verified', 'rejected')),
  name text not null check (char_length(name) between 2 and 80),
  branch text not null check (char_length(branch) between 2 and 60),
  graduation_year int not null check (graduation_year between 1980 and 2100),
  created_at timestamptz not null default now()
);

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles (id) on delete cascade,
  title text not null check (char_length(title) between 8 and 140),
  company_or_exam text not null check (char_length(company_or_exam) between 2 and 80),
  description text not null check (char_length(description) between 80 and 20000),
  category text not null check (category in ('interview', 'internship', 'exam', 'certification')),
  role text check (role is null or char_length(role) <= 80),
  branch text not null check (char_length(branch) between 2 and 60),
  graduation_year int not null check (graduation_year between 1980 and 2100),
  tags text[] not null default '{}' check (coalesce(array_length(tags, 1), 0) <= 6),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);

create table public.connect_requests (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  requester_id uuid not null references public.profiles (id) on delete cascade,
  recipient_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (post_id, requester_id),
  check (requester_id <> recipient_id)
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type text not null check (type in (
    'comment', 'connect_request', 'connect_accepted', 'connect_declined',
    'verification_approved', 'verification_rejected'
  )),
  reference_id uuid,
  message text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.post_reports (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  reason text not null check (char_length(reason) between 5 and 500),
  status text not null default 'open' check (status in ('open', 'dismissed')),
  created_at timestamptz not null default now(),
  unique (post_id, reporter_id)
);

create index posts_created_at_idx on public.posts (created_at desc);
create index posts_author_idx on public.posts (author_id);
create index posts_company_idx on public.posts (lower(company_or_exam));
create index posts_category_idx on public.posts (category);
create index posts_branch_idx on public.posts (branch);
create index posts_tags_idx on public.posts using gin (tags);
create index comments_post_idx on public.comments (post_id, created_at);
create index connect_recipient_idx on public.connect_requests (recipient_id, created_at desc);
create index connect_requester_idx on public.connect_requests (requester_id, created_at desc);
create index notifications_user_idx on public.notifications (user_id, is_read, created_at desc);
create index post_reports_status_idx on public.post_reports (status, created_at desc);

-- ---------------------------------------------------------------------------
-- 2. Permission helpers
--    SECURITY DEFINER so policies can read profiles without recursing into
--    the profiles policies themselves.
-- ---------------------------------------------------------------------------

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
$$;

-- Students and admins are trusted by their email; alumni only once verified.
create or replace function public.is_verified_member()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and (role <> 'alumni' or verification_status = 'verified')
  )
$$;

-- Seniors, verified alumni and admins may publish experiences.
create or replace function public.can_post()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role in ('senior', 'alumni', 'admin')
      and (role <> 'alumni' or verification_status = 'verified')
  )
$$;

-- ---------------------------------------------------------------------------
-- 3. Triggers
-- ---------------------------------------------------------------------------

-- 3.1 Create the profile when someone signs up. The role is decided here, on
--     the server, from the account type and graduation year. A client cannot
--     ask for a role, and a student cannot use a non-college email.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  account_type text := coalesce(new.raw_user_meta_data ->> 'account_type', '');
  full_name text := trim(coalesce(new.raw_user_meta_data ->> 'name', ''));
  user_branch text := trim(coalesce(new.raw_user_meta_data ->> 'branch', ''));
  grad_year int := nullif(new.raw_user_meta_data ->> 'graduation_year', '')::int;
  final_batch int := public.final_year_batch();
  new_role text;
  new_status text;
begin
  if grad_year is null then
    raise exception 'Graduation year is required.';
  end if;

  if account_type = 'student' then
    if lower(split_part(new.email, '@', 2)) <> lower(public.college_email_domain()) then
      raise exception 'Students must sign up with their college email address.';
    end if;
    if grad_year < final_batch or grad_year > final_batch + 3 then
      raise exception 'That graduation year is not a current batch. Graduates sign up as alumni.';
    end if;
    new_role := case when grad_year <= final_batch + 1 then 'senior' else 'junior' end;
    new_status := 'not_required';
  elsif account_type = 'alumni' then
    if grad_year >= final_batch then
      raise exception 'Alumni must have already graduated.';
    end if;
    new_role := 'alumni';
    new_status := 'pending';
  else
    raise exception 'Choose Student or Alumni to sign up.';
  end if;

  insert into public.profiles (id, email, role, verification_status, name, branch, graduation_year)
  values (new.id, lower(new.email), new_role, new_status, full_name, user_branch, grad_year);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 3.2 Members may edit their name and branch, nothing else. Role and
--     verification can only change through an admin or the SQL editor
--     (where auth.uid() is null).
create or replace function public.protect_profile_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    if new.role is distinct from old.role
      or new.verification_status is distinct from old.verification_status
      or new.email is distinct from old.email
      or new.graduation_year is distinct from old.graduation_year
      or new.created_at is distinct from old.created_at then
      raise exception 'You cannot change this part of your profile.';
    end if;
  end if;
  return new;
end;
$$;

create trigger profiles_protect_columns
  before update on public.profiles
  for each row execute function public.protect_profile_columns();

-- 3.3 updated_at
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger posts_touch before update on public.posts
  for each row execute function public.touch_updated_at();

create trigger connect_requests_touch before update on public.connect_requests
  for each row execute function public.touch_updated_at();

-- 3.4 Notifications. Written by triggers so the app never needs a
--     service-role key and members cannot forge notifications.
create or replace function public.notify_on_comment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  post_row public.posts%rowtype;
  commenter text;
begin
  select * into post_row from public.posts where id = new.post_id;
  if post_row.author_id <> new.author_id then
    select name into commenter from public.profiles where id = new.author_id;
    insert into public.notifications (user_id, type, reference_id, message)
    values (post_row.author_id, 'comment', post_row.id,
            commenter || ' commented on “' || post_row.title || '”.');
  end if;
  return new;
end;
$$;

create trigger comments_notify after insert on public.comments
  for each row execute function public.notify_on_comment();

create or replace function public.notify_on_connect_request()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requester text;
  post_title text;
begin
  select name into requester from public.profiles where id = new.requester_id;
  select title into post_title from public.posts where id = new.post_id;
  insert into public.notifications (user_id, type, reference_id, message)
  values (new.recipient_id, 'connect_request', new.id,
          requester || ' wants to connect about “' || post_title || '”.');
  return new;
end;
$$;

create trigger connect_requests_notify_new after insert on public.connect_requests
  for each row execute function public.notify_on_connect_request();

create or replace function public.notify_on_connect_response()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  recipient text;
begin
  if new.status is distinct from old.status and new.status in ('accepted', 'declined') then
    select name into recipient from public.profiles where id = new.recipient_id;
    insert into public.notifications (user_id, type, reference_id, message)
    values (new.requester_id, 'connect_' || new.status, new.id,
            recipient || ' ' || new.status || ' your connect request.');
  end if;
  return new;
end;
$$;

create trigger connect_requests_notify_response after update on public.connect_requests
  for each row execute function public.notify_on_connect_response();

-- ---------------------------------------------------------------------------
-- 4. Functions the app calls (RPC)
-- ---------------------------------------------------------------------------

-- Email is not readable through the profiles table. This returns it only to
-- the owner, to an admin, or to someone with an accepted connection.
create or replace function public.get_contact_email(other_user uuid)
returns text
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    return null;
  end if;
  if auth.uid() = other_user
    or public.is_admin()
    or exists (
      select 1 from public.connect_requests
      where status = 'accepted'
        and ((requester_id = auth.uid() and recipient_id = other_user)
          or (recipient_id = auth.uid() and requester_id = other_user))
    ) then
    return (select email from public.profiles where id = other_user);
  end if;
  return null;
end;
$$;

create or replace function public.admin_pending_alumni()
returns table (
  id uuid,
  email text,
  role text,
  verification_status text,
  name text,
  branch text,
  graduation_year int,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Only administrators can review alumni.';
  end if;
  return query
    select p.id, p.email, p.role, p.verification_status, p.name, p.branch, p.graduation_year, p.created_at
    from public.profiles p
    where p.role = 'alumni' and p.verification_status = 'pending'
    order by p.created_at;
end;
$$;

create or replace function public.admin_set_verification(target uuid, new_status text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Only administrators can verify alumni.';
  end if;
  if new_status not in ('verified', 'rejected') then
    raise exception 'Status must be verified or rejected.';
  end if;

  update public.profiles
  set verification_status = new_status
  where id = target and role = 'alumni';

  if not found then
    raise exception 'That alumni account does not exist.';
  end if;

  insert into public.notifications (user_id, type, reference_id, message)
  values (
    target,
    case when new_status = 'verified' then 'verification_approved' else 'verification_rejected' end,
    null,
    case when new_status = 'verified'
      then 'Your alumni account is verified. You can now share experiences and connect with students.'
      else 'Your alumni verification was not approved. Contact the coordinator if this looks wrong.'
    end
  );
end;
$$;

create or replace function public.admin_stats()
returns json
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Only administrators can view statistics.';
  end if;
  return json_build_object(
    'users', (select count(*) from public.profiles),
    'verifiedAlumni', (select count(*) from public.profiles where role = 'alumni' and verification_status = 'verified'),
    'experiences', (select count(*) from public.posts),
    'connectRequests', (select count(*) from public.connect_requests)
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- 5. Public homepage previews
--    Full experiences are members-only. Signed-out visitors see only this
--    teaser: a short excerpt and the author's name. The view intentionally
--    runs with its owner's rights so it can read past the posts policy.
-- ---------------------------------------------------------------------------

create view public.post_previews as
  select
    p.id,
    p.title,
    p.company_or_exam,
    p.category,
    p.role,
    p.branch,
    p.graduation_year,
    left(regexp_replace(regexp_replace(p.description, '[#*]+', '', 'g'), '\s+', ' ', 'g'), 200) as excerpt,
    p.created_at,
    a.name as author_name,
    a.role as author_role,
    (select count(*)::int from public.comments c where c.post_id = p.id) as comment_count
  from public.posts p
  join public.profiles a on a.id = p.author_id;

-- ---------------------------------------------------------------------------
-- 6. Row Level Security
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.comments enable row level security;
alter table public.connect_requests enable row level security;
alter table public.notifications enable row level security;
alter table public.post_reports enable row level security;

-- profiles: members can see each other, edit only themselves.
create policy "Members can view profiles"
  on public.profiles for select to authenticated
  using (true);

create policy "Members can edit their own profile"
  on public.profiles for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- posts: members read; seniors, verified alumni and admins write their own.
create policy "Members can read experiences"
  on public.posts for select to authenticated
  using (true);

create policy "Verified contributors can publish"
  on public.posts for insert to authenticated
  with check (author_id = auth.uid() and public.can_post());

create policy "Authors can edit their own experience"
  on public.posts for update to authenticated
  using (author_id = auth.uid() and public.is_verified_member())
  with check (author_id = auth.uid() and public.is_verified_member());

create policy "Authors and admins can delete an experience"
  on public.posts for delete to authenticated
  using (author_id = auth.uid() or public.is_admin());

-- comments
create policy "Members can read comments"
  on public.comments for select to authenticated
  using (true);

create policy "Verified members can comment"
  on public.comments for insert to authenticated
  with check (author_id = auth.uid() and public.is_verified_member());

create policy "Authors and admins can delete a comment"
  on public.comments for delete to authenticated
  using (author_id = auth.uid() or public.is_admin());

-- connect requests: visible only to the two people involved.
create policy "Participants can view their connect requests"
  on public.connect_requests for select to authenticated
  using (requester_id = auth.uid() or recipient_id = auth.uid());

create policy "Verified members can send a connect request"
  on public.connect_requests for insert to authenticated
  with check (
    requester_id = auth.uid()
    and public.is_verified_member()
    and status = 'pending'
    and recipient_id = (select author_id from public.posts where id = post_id)
  );

create policy "Recipients can answer a pending request"
  on public.connect_requests for update to authenticated
  using (recipient_id = auth.uid() and status = 'pending' and public.is_verified_member())
  with check (recipient_id = auth.uid() and status in ('accepted', 'declined'));

-- notifications: owner only. Rows are created by triggers.
create policy "Members can read their notifications"
  on public.notifications for select to authenticated
  using (user_id = auth.uid());

create policy "Members can mark their notifications read"
  on public.notifications for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- reports: any verified member can flag; only admins see the queue.
create policy "Verified members can report an experience"
  on public.post_reports for insert to authenticated
  with check (reporter_id = auth.uid() and public.is_verified_member());

create policy "Admins and the reporter can view a report"
  on public.post_reports for select to authenticated
  using (public.is_admin() or reporter_id = auth.uid());

create policy "Admins can resolve reports"
  on public.post_reports for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- 7. Grants
--    RLS decides which rows; these decide which columns and operations.
-- ---------------------------------------------------------------------------

revoke all on public.profiles, public.posts, public.comments, public.connect_requests,
  public.notifications, public.post_reports from anon, authenticated;

-- Email is deliberately left out. Use get_contact_email().
grant select (id, role, verification_status, name, branch, graduation_year, created_at)
  on public.profiles to authenticated;
grant update (name, branch) on public.profiles to authenticated;

grant select, delete on public.posts to authenticated;
grant insert (author_id, title, company_or_exam, description, category, role, branch, graduation_year, tags)
  on public.posts to authenticated;
grant update (title, company_or_exam, description, category, role, branch, graduation_year, tags)
  on public.posts to authenticated;

grant select, delete on public.comments to authenticated;
grant insert (post_id, author_id, body) on public.comments to authenticated;

grant select on public.connect_requests to authenticated;
grant insert (post_id, requester_id, recipient_id) on public.connect_requests to authenticated;
grant update (status) on public.connect_requests to authenticated;

grant select on public.notifications to authenticated;
grant update (is_read) on public.notifications to authenticated;

grant select on public.post_reports to authenticated;
grant insert (post_id, reporter_id, reason) on public.post_reports to authenticated;
grant update (status) on public.post_reports to authenticated;

grant select on public.post_previews to anon, authenticated;

revoke execute on function public.get_contact_email(uuid) from public, anon;
revoke execute on function public.admin_pending_alumni() from public, anon;
revoke execute on function public.admin_set_verification(uuid, text) from public, anon;
revoke execute on function public.admin_stats() from public, anon;
grant execute on function public.get_contact_email(uuid) to authenticated;
grant execute on function public.admin_pending_alumni() to authenticated;
grant execute on function public.admin_set_verification(uuid, text) to authenticated;
grant execute on function public.admin_stats() to authenticated;
