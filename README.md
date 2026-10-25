# Senior-Junior Connect

> **CI/CD (CCA 2):** this repo is built and deployed by Jenkins on AWS → Docker Hub → Kubernetes (Minikube). See [DEPLOYMENT.md](DEPLOYMENT.md) for the pipeline report, and `Jenkinsfile`, `Dockerfile`, `k8s/`, `infra/` for the files.

A college-only platform where seniors and alumni write up their interview, internship, exam and certification experiences, and juniors read, search, comment and connect. Built for the PBL III project from the Version 1.0 PRD.

The placeholder name is **SeniorCircle**. Change it in one place: `lib/constants/site.ts`.

## Run it now (demo mode)

```bash
npm install
npm run dev
```

Open http://localhost:3000. With no Supabase keys the app runs on sample data held in memory, and the sign-in page offers one-click demo accounts for every role (junior, senior, verified alumna, pending alumnus, admin). Demo data resets when the server restarts.

> This folder is inside OneDrive. `node_modules` and `.next` contain tens of thousands of small files, so either pause OneDrive sync while you work or move the project to a folder outside OneDrive (for example `C:\dev\SEMproj`).

## Connect Supabase

1. Create a project at supabase.com.
2. Open `supabase/migrations/0001_schema.sql`. The student email domain is already set to `mitwpu.edu.in` in `college_email_domain()` near the top.
3. Paste the whole file into the Supabase SQL editor and run it, then do the same with `supabase/migrations/0002_search_insights_votes.sql`. The second one adds pgvector, the insight columns and voting; run them in order.
4. Copy `.env.example` to `.env.local` and fill in:
   - `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Project Settings → API)
   - `GEMINI_API_KEY` for semantic search and insights (see Assistant chatbot below)
   - `COLLEGE_EMAIL_DOMAIN` (optional; defaults to `mitwpu.edu.in`)
   - `NEXT_PUBLIC_SITE_URL` (`http://localhost:3000` locally, your Vercel URL in production)
5. In Supabase → Authentication → URL Configuration, set the Site URL to the same value and add `<site url>/auth/callback` to the redirect URLs.
6. Restart `npm run dev`. The demo banner disappears.

### Make the first admin

Sign up through the site, then run this in the SQL editor:

```sql
update public.profiles set role = 'admin', verification_status = 'not_required'
where email = 'you@your-college-domain';
```

Admins are only ever created this way. Nothing in the app can grant the role.

### Sample experiences

After the first admin or senior account exists, run `supabase/seed.sql` to load ten sample experiences owned by that account.

The seed carries no votes, because every sample post belongs to one account and nobody may vote on their own experience. Trending ranks them by recency until members start voting. The samples also arrive without embeddings or insights: open the admin dashboard and use **Search & Insights** to process them.

## Who can do what

| | Read | Comment, connect, report | Post | Admin dashboard |
|---|---|---|---|---|
| Junior | yes | yes | no | no |
| Senior | yes | yes | yes | no |
| Alumni, pending or rejected | yes | no | no | no |
| Alumni, verified | yes | yes | yes | no |
| Admin | yes | yes | yes | yes |

- Final-year and pre-final-year students are seniors; earlier years are juniors. The role is set from the graduation year when the account is created and is not chosen by the user.
- Student signup requires an `@mitwpu.edu.in` email (for example `raj.deshmukh1@mitwpu.edu.in`). Alumni sign up with a personal email and start as `pending`.
- Each rule is enforced three times: the interface hides what you cannot do, every server action re-checks it, and Row Level Security in the database refuses it.

## How it is built

- **Next.js 15 (App Router), TypeScript, Tailwind CSS.** Pages are Server Components; forms post to server actions in `lib/actions/`.
- **Supabase** for Postgres and Auth. The app uses only the anon key with the member's session, so every query runs under RLS. There is no service-role key anywhere.
- **Notifications** are written by database triggers (new comment, connect request, accept or decline) and by the admin verification function.
- **Email privacy:** member emails are not readable through the `profiles` table. `get_contact_email()` returns one only to its owner, an admin, or someone with an accepted connection.
- **Data layer:** `lib/data/repo.ts` defines one interface with two implementations, `supabase.ts` and `mock.ts`. Pages never know which is live.

```
app/                 routes (home, feed, experiences, auth, profile, connections, notifications, admin, about)
components/          layout, home, experiences, filters, notifications, connections, profile, admin, auth, ui
lib/actions/         server actions (auth, posts, comments, connect, notifications, reports, admin, profile)
lib/auth/            session lookup and permission rules
lib/data/            repository interface, Supabase and mock implementations, feed filters
lib/constants/       site name, branches, categories, batch-year rules
lib/chat/            assistant chatbot: models, memory, retrieval, prompt
lib/ai/              model keys, embeddings, structured extraction, enrichment
lib/validation/      zod schemas
lib/mock/seed.ts     demo data
supabase/            migrations (schema, triggers, RLS, grants, vectors, votes) and seed
middleware.ts        session refresh and sign-in redirect for protected routes
```

## Assistant chatbot

Signed-in members get an **Ask** button on every page. It answers questions such as "What should I prepare for Barclays?" from the experiences in the database and links to the ones it used. It also answers general career questions and questions about how the site works.

- **Retrieval:** two retrievers, fused. Keyword scoring never misses a company named outright; vector search finds experiences that share meaning rather than words, so "which companies ask system design" matches a write-up using neither phrase. Their ranks are combined with reciprocal rank fusion. Every prompt also carries an archive overview -- every company and exam with counts, the topics asked most often -- so questions about what the site holds are answered from data rather than guessed at. Without `GEMINI_API_KEY` the vector half is skipped and retrieval falls back to keywords alone.
- **Models:** Groq is the main model and Gemini is the fallback. Groq retires models from time to time, so if answers stop working set `GROQ_MODEL` in `.env.local` to a current one from console.groq.com/docs/models. Add `GROQ_API_KEY`, and optionally `GEMINI_API_KEY`, to `.env.local` and restart the server. Without a key the assistant lists the matching experiences instead of writing an answer.
- **Privacy:** the assistant reads experiences through the same data layer as the feed, so Row Level Security applies and it only sees what the member may read. The question and the matching experience text are sent to Groq or Gemini to write the answer. Member emails are never sent.
- **Limits:** 20 questions per member every five minutes. The conversation is kept in the browser tab and is not stored in the database.
- **Voice:** tap the microphone to ask out loud, and the answer is read back sentence by sentence as it arrives. Talking while it reads stops it, so you can interrupt. This uses the speech recognition and speech synthesis built into the browser, so it needs no API key; it works in Chrome, Edge and Safari, and the microphone button is hidden where the browser has no support (Firefox, and Brave with its default settings). Code in `lib/hooks/useSpeech.ts`.
- **Code:** `lib/chat/` (models, memory, retrieval, prompt), `app/api/chat/route.ts` (streaming endpoint) and `components/chat/` (the widget).

The design is adapted from the Reflex Loop voice agent (github.com/Aditya-Patil27/chat-bot): the same Groq and Gemini pairing, streaming replies that can be stopped mid-answer, and a conversation memory that keeps recent turns and summarises older ones. Its speech input and output are done here with the browser’s own speech services instead of Deepgram.

## Insights and trending

- **Insights.** When an experience is saved it is embedded for search and read by a model, which pulls out the rounds, what each tested, the topics asked, the difficulty and the outcome (`lib/ai/extract.ts`). These show as **At a glance** above the write-up and as chips on the cards. It runs after the response, so posting stays fast, and it never blocks a save: an experience with no insights simply displays as it always did. Older posts are caught up from the admin dashboard, five at a time.
- **Trending.** Ranked by Reddit's hot formula with one correction: Reddit multiplies the age term by `sign(score)`, which collapses every unvoted post to exactly zero, so new experiences sort arbitrarily. Here the age always counts and the score shifts it. Twelve and a half hours of age is worth one factor of ten in score. The value is stored on the row and recomputed by a trigger when a vote changes, so reads are a plain indexed sort.
- **Downvotes are kept but not published.** They count towards the ranking, because a thin write-up should fall. Members see one number, the net score -- showing upvotes and the net together would let anyone subtract one from the other, which is the thing being withheld. The split is admin-only, through `admin_vote_breakdown()`, and it is on the dashboard so a post being quietly buried is visible to somebody. Nobody may vote on their own experience; the policy in migration 0002 enforces that, not just the interface.

## Product decisions worth knowing

- **Experiences are members-only.** The PRD restricts access to the college community, so the feed and full posts need sign-in. The homepage shows short public previews through the `post_previews` view.
- **Accepted connections reveal email.** V1 has no chat, so this is how two people continue the conversation.
- **Tags are free text; branch, type and graduation year are fixed lists.** This answers the PRD's open question in favour of search quality.
- **Alumni verification is manual admin approval.** ID or LinkedIn checks are left for later, as the PRD suggests.
- **No realtime.** The notification count updates on each page load. Supabase Realtime can be added later without schema changes.

Not built, by design (PRD V1 exclusions): chat, push or email notifications, mobile app, multi-college support.

## Checks

```bash
npm run typecheck
npm run lint
npm run build
```

## Deploy

Push to GitHub, import the repository in Vercel, add the four environment variables from `.env.example`, and deploy. Then update the Site URL and redirect URL in Supabase to the Vercel domain.
