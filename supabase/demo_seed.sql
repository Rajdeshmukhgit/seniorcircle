-- Demo data for a presentation: nine sample members, ten experiences written by
-- different seniors and alumni, comments, connect requests, notifications, two
-- alumni waiting for verification and one flagged post.
--
-- Run this in the Supabase SQL editor AFTER the migration. It is safe to run on
-- a database that already has real accounts: it only adds rows, and it stops
-- if the demo members already exist.
--
-- Every demo member signs in with the same password:
--     Demo-00cbed19-2026
-- Sign-in emails are listed at the bottom of this file.
--
-- Remove everything again with supabase/demo_cleanup.sql. Do that before real
-- students use the site: these accounts share a password that is in this file.

do $demo$
declare
  demo_password constant text := 'Demo-00cbed19-2026';
  member record;
  new_id uuid;
  senior1 uuid; senior2 uuid; senior3 uuid;
  junior1 uuid; junior2 uuid;
  alumna1 uuid; alumnus2 uuid; alumnus3 uuid; alumna4 uuid;
  p1 uuid := gen_random_uuid(); p2 uuid := gen_random_uuid(); p3 uuid := gen_random_uuid();
  p4 uuid := gen_random_uuid(); p5 uuid := gen_random_uuid(); p6 uuid := gen_random_uuid();
  p7 uuid := gen_random_uuid(); p8 uuid := gen_random_uuid(); p9 uuid := gen_random_uuid();
  p10 uuid := gen_random_uuid();
begin
  if exists (select 1 from auth.users where email like 'demo.%') then
    raise notice 'Demo members already exist. Nothing was added.';
    return;
  end if;

  -- 1. Members. Inserting into auth.users fires the same trigger a real signup
  --    does, so roles are decided by the database exactly as in the app.
  for member in
    select * from (values
      ('senior1',  'demo.senior1@mitwpu.edu.in', 'student', 'Aditya Kulkarni',  'Computer Engineering',   2027),
      ('senior2',  'demo.senior2@mitwpu.edu.in', 'student', 'Sneha Patil',      'AI & Data Science',      2027),
      ('senior3',  'demo.senior3@mitwpu.edu.in', 'student', 'Rohan Joshi',      'Information Technology', 2028),
      ('junior1',  'demo.junior1@mitwpu.edu.in', 'student', 'Ananya Deshpande', 'Computer Engineering',   2029),
      ('junior2',  'demo.junior2@mitwpu.edu.in', 'student', 'Kabir Shah',       'Information Technology', 2030),
      ('alumna1',  'demo.alumna1@example.com',   'alumni',  'Meera Iyer',       'Information Technology', 2024),
      ('alumnus2', 'demo.alumnus2@example.com',  'alumni',  'Vikram Nair',      'Electronics',            2025),
      ('alumnus3', 'demo.alumnus3@example.com',  'alumni',  'Arjun Mehta',      'Mechanical',             2023),
      ('alumna4',  'demo.alumna4@example.com',   'alumni',  'Pooja Rao',        'Computer Engineering',   2022)
    ) as t(key, email, account_type, name, branch, graduation_year)
  loop
    new_id := gen_random_uuid();

    insert into auth.users
      (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
       raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
       confirmation_token, recovery_token, email_change, email_change_token_new)
    values
      ('00000000-0000-0000-0000-000000000000', new_id, 'authenticated', 'authenticated', member.email,
       extensions.crypt(demo_password, extensions.gen_salt('bf', 10)), now(),
       '{"provider":"email","providers":["email"]}'::jsonb,
       jsonb_build_object('account_type', member.account_type, 'name', member.name,
                          'branch', member.branch, 'graduation_year', member.graduation_year::text),
       now(), now(), '', '', '', '');

    insert into auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), new_id, new_id::text, 'email',
            jsonb_build_object('sub', new_id::text, 'email', member.email, 'email_verified', true),
            now(), now(), now());

    case member.key
      when 'senior1' then senior1 := new_id;
      when 'senior2' then senior2 := new_id;
      when 'senior3' then senior3 := new_id;
      when 'junior1' then junior1 := new_id;
      when 'junior2' then junior2 := new_id;
      when 'alumna1' then alumna1 := new_id;
      when 'alumnus2' then alumnus2 := new_id;
      when 'alumnus3' then alumnus3 := new_id;
      when 'alumna4' then alumna4 := new_id;
    end case;
  end loop;

  -- 2. Two alumni are verified and can post. The other two stay pending, so
  --    the admin dashboard has a verification queue to show.
  update public.profiles set verification_status = 'verified' where id in (alumna1, alumnus2);
  update public.profiles set created_at = now() - interval '40 days' where id in (senior1, senior2, senior3, alumna1, alumnus2);
  update public.profiles set created_at = now() - interval '12 days' where id in (junior1, junior2);
  update public.profiles set created_at = now() - interval '2 days'  where id = alumnus3;
  update public.profiles set created_at = now() - interval '5 hours' where id = alumna4;

  -- 3. Experiences.
  insert into public.posts
    (id, author_id, title, company_or_exam, category, role, branch, graduation_year, tags, description, created_at, updated_at)
  values
    (p1, senior1, $seed$Barclays Software Engineer Interview Experience$seed$, $seed$Barclays$seed$, 'interview', $seed$Software Engineer$seed$, $seed$Computer Engineering$seed$, 2027,
     array['on-campus', 'dsa', 'dbms'],
     $seed$Barclays visited campus in the first week of September. Around 310 students sat the online assessment, 42 were shortlisted and 11 got offers.

## Online assessment
- 90 minutes on HackerRank: 2 coding questions and 20 MCQs
- Coding: a sliding-window problem on the longest substring with at most K distinct characters, and a graph question that reduced to counting connected components
- MCQs covered DBMS normalisation, OS scheduling and output prediction in Java

Solving both questions fully mattered. Most people who were shortlisted had passed every hidden test case.

## Technical round
The interviewer opened with my resume project and stayed there for twenty minutes. Be ready to draw your schema and justify every table.

- **DSA:** merge intervals, then a follow-up asking for an in-place version
- **DBMS:** difference between clustered and non-clustered indexes, and when a covering index helps
- **OOP:** design a parking lot. They cared more about how I split responsibilities than about the final class diagram

## HR round
Short and friendly. Why Barclays, relocation to Pune, and one situation where I disagreed with a teammate.

## What I would do differently
- Start timed practice a month earlier. Speed in the assessment decided the shortlist
- Revise DBMS from my own notes instead of fresh videos the night before
- Keep one project I can explain end to end, including what went wrong$seed$,
     now() - interval '1 days', now() - interval '1 days'),
    (p2, alumna1, $seed$GATE CSE Preparation Experience: AIR 412 Alongside Final Year$seed$, $seed$GATE$seed$, 'exam', $seed$CSE$seed$, $seed$Information Technology$seed$, 2024,
     array['gate', 'self-study', 'timetable'],
     $seed$I prepared for GATE CSE through my final year without leaving placements, and finished at AIR 412. This is the plan I actually followed, not the one I wrote in June.

## Timeline
- **June to August:** Discrete maths, digital logic and COA. One subject at a time, with previous-year questions after every topic
- **September to November:** OS, DBMS, networks and algorithms. Placements cut my hours in half here, so I only did standard questions
- **December and January:** full-length tests every third day and a revision notebook of mistakes

## What worked
- Previous-year questions are the syllabus. I solved the last fifteen years twice
- A mistake notebook. Before each mock I read only that
- Short notes written by hand. Typing them never stuck

## What did not
- Collecting material. I had three test series and finished one
- Skipping aptitude until January. It is fifteen marks that need almost no theory

## For students in second and third year
Your regular semester subjects are most of the GATE syllabus. If you study TOC, OS and DBMS properly when they are taught, the final year becomes revision instead of first contact.$seed$,
     now() - interval '3 days', now() - interval '3 days'),
    (p3, alumnus2, $seed$AWS Solutions Architect Associate Certification Journey$seed$, $seed$AWS Certification$seed$, 'certification', $seed$Solutions Architect Associate$seed$, $seed$Electronics$seed$, 2025,
     array['cloud', 'aws', 'six-weeks'],
     $seed$I come from Electronics and had no cloud background. I passed SAA-C03 with 812 after six weeks of evening study while working full time.

## How I split the six weeks
- **Weeks 1 and 2:** one video course at normal speed, with a free-tier account open beside it
- **Weeks 3 and 4:** hands-on. I built a three-tier app with a load balancer, an auto scaling group and RDS, then broke it on purpose
- **Weeks 5 and 6:** practice exams. I reviewed every wrong option, including the ones I guessed right

## Topics that carried the most weight
- VPC design: subnets, NAT gateways, security groups against network ACLs
- S3 storage classes and lifecycle rules
- Choosing between SQS, SNS and EventBridge
- High availability patterns across availability zones

## Is it worth it for a student?
It did not get me a job by itself. It did give me vocabulary for interviews and made my final-year project deployable. If you are in third year, do the hands-on part even if you skip the exam.$seed$,
     now() - interval '5 days', now() - interval '5 days'),
    (p4, senior2, $seed$Mastercard Internship Interview Experience$seed$, $seed$Mastercard$seed$, 'internship', $seed$Software Engineering Intern$seed$, $seed$AI & Data Science$seed$, 2027,
     array['on-campus', 'internship', 'sql'],
     $seed$Mastercard hired summer interns from third year. The process took two days: an online test, one technical interview and one managerial interview.

## Online test
- 3 coding questions in 75 minutes, medium difficulty
- One was a straightforward two-pointer problem, one needed a min-heap, and the last was a DP on strings that few people finished

## Technical interview
- Walked through my ML project. They asked how I would serve the model to a thousand requests a second, which I had never thought about
- SQL: second-highest salary per department, then the same with a window function
- A puzzle about measuring 45 minutes with two ropes

## Managerial interview
Mostly behavioural. Tell me about a time you learned something quickly, and a time a project slipped.

## Advice
Know your project beyond the notebook. Deployment, monitoring and failure cases came up in every panel my friends sat in as well.$seed$,
     now() - interval '6 days', now() - interval '6 days'),
    (p5, alumna1, $seed$CAT Preparation Strategy for Engineers With a Full Timetable$seed$, $seed$CAT$seed$, 'exam', $seed$MBA entrance$seed$, $seed$Information Technology$seed$, 2024,
     array['cat', 'mba', 'varc'],
     $seed$I wrote CAT in my final year and scored 98.6 percentile. Quant was comfortable as an engineer. Reading comprehension was not.

## Section by section
- **VARC:** one long article every day from a newspaper editorial page, then two RC sets. This took four months to show results
- **DILR:** set selection is the whole game. I practised choosing two sets out of four in the first five minutes
- **Quant:** arithmetic and algebra are most of the paper. I skipped the hardest geometry

## Mocks
I took 28 mocks. The score only started moving after I spent twice as long analysing each mock as writing it.

## If you are in third year
Start reading now. Nothing else needs a year.$seed$,
     now() - interval '9 days', now() - interval '9 days'),
    (p6, senior3, $seed$PhonePe SDE Intern: Three Rounds in One Day$seed$, $seed$PhonePe$seed$, 'internship', $seed$SDE Intern$seed$, $seed$Information Technology$seed$, 2028,
     array['off-campus', 'dsa', 'machine-coding'],
     $seed$I applied off-campus through a referral from a senior I met at a college hackathon. The whole loop ran in one day over video.

## Round 1: DSA
- Find the kth largest element in a stream
- Lowest common ancestor in a binary tree, then the same for a general tree

## Round 2: machine coding
Ninety minutes to build an in-memory splitwise-style expense tracker. They ran my code against their own cases at the end. Clean function names and handling bad input counted.

## Round 3: hiring manager
Design discussion about how I would store transaction history for fast lookups, followed by questions on why I picked my tech stack.

## What helped
- Practising machine coding with a timer. It is a different skill from DSA
- Asking for the referral. Seniors say yes more often than you expect$seed$,
     now() - interval '11 days', now() - interval '11 days'),
    (p7, senior2, $seed$ZS Associates Decision Analytics Associate Interview$seed$, $seed$ZS Associates$seed$, 'interview', $seed$Decision Analytics Associate$seed$, $seed$AI & Data Science$seed$, 2027,
     array['on-campus', 'case-study', 'aptitude'],
     $seed$ZS runs a process that is unlike product companies. There is very little DSA and a lot of structured thinking.

## Aptitude and video round
- Quant, logical reasoning and reading comprehension with tight sectional timers
- A recorded video round with three behavioural prompts

## Case interview
I was asked to estimate the number of insulin pens sold in Pune in a year. State your assumptions aloud and keep the arithmetic simple. The interviewer changed one assumption midway to see whether my structure held.

## Technical and HR
Basic SQL joins, one probability question, and a conversation about why analytics over development.

## Advice
Practise five or six guesstimates aloud with a friend. Thinking silently for two minutes is the most common reason people were rejected.$seed$,
     now() - interval '14 days', now() - interval '14 days'),
    (p8, alumnus2, $seed$Siemens Graduate Trainee Engineer: Core Electronics Interview$seed$, $seed$Siemens$seed$, 'interview', $seed$Graduate Trainee Engineer$seed$, $seed$Electronics$seed$, 2025,
     array['on-campus', 'core', 'embedded'],
     $seed$For Electronics students who want a core role: Siemens asked real fundamentals, and the students who had revised second-year subjects did best.

## Written test
- Analog and digital electronics, control systems and basic C
- No negative marking, so attempt everything

## Technical interview
- Draw and explain an op-amp integrator
- Difference between a microprocessor and a microcontroller, with examples I had used
- Write C to toggle a GPIO pin with a software debounce
- My final-year project on motor control took half the interview

## HR
Willingness to work shifts at a plant, and relocation.

## Advice
Keep your lab manuals. Half my questions were experiments we had done in fourth semester.$seed$,
     now() - interval '18 days', now() - interval '18 days'),
    (p9, alumnus2, $seed$GRE in Eight Weeks: 326 With a Day Job$seed$, $seed$GRE$seed$, 'exam', $seed$MS applications$seed$, $seed$Electronics$seed$, 2025,
     array['gre', 'ms', 'vocabulary'],
     $seed$Score: 326 (Quant 168, Verbal 158, AWA 4.0). I studied for eight weeks, about ninety minutes on weekdays.

## Plan
- **Weeks 1 to 3:** vocabulary in context. Thirty words a day with a sentence each, reviewed on the bus
- **Weeks 4 to 6:** official practice sets, one section a day
- **Weeks 7 and 8:** four full-length tests at the same time of day as my slot

## Notes
- Quant is school maths with traps. Read the last line of every question twice
- For verbal, official material is the only thing that matches the real test
- Write at least four timed essays before the exam

Book your slot first. A date on the calendar did more for my discipline than any plan.$seed$,
     now() - interval '22 days', now() - interval '22 days'),
    (p10, senior3, $seed$Barclays Summer Internship: What the Technical Round Looked Like$seed$, $seed$Barclays$seed$, 'internship', $seed$Technology Intern$seed$, $seed$Information Technology$seed$, 2028,
     array['on-campus', 'internship', 'java'],
     $seed$The internship drive opens to third-year students. Shortlisting was on the online test alone.

## Online test
Two coding questions and aptitude. Both questions were array based and medium.

## Technical plus HR round
One combined round of about forty minutes.

- Reverse a linked list in groups of K
- Explain how HashMap works in Java and what happens on a collision
- Why banking technology, and what I knew about the team's work in Pune

## Advice
Core Java gets asked more than people expect here. Collections, exceptions and the difference between an interface and an abstract class all came up.$seed$,
     now() - interval '27 days', now() - interval '27 days');

  -- 4. Comments. Each one also creates a notification for the author.
  insert into public.comments (post_id, author_id, body, created_at) values
    (p1, junior1,  'Thank you for this. Was the online assessment proctored, and could you switch between the two coding questions?', now() - interval '20 hours'),
    (p1, senior1,  'Yes, webcam proctored. You can move between questions freely, but the MCQ section locks once you submit it.', now() - interval '18 hours'),
    (p1, junior2,  'How much DBMS should a second-year student know before the internship drive?', now() - interval '6 hours'),
    (p1, senior3,  'Normalisation, joins and indexing covered almost everything I was asked.', now() - interval '5 hours'),
    (p2, junior1,  'Did you join a test series from the start, or only after finishing the syllabus?', now() - interval '2 days'),
    (p2, alumna1,  'Only after about 70 percent of the syllabus. Before that, topic-wise previous-year questions were enough.', now() - interval '2 days' + interval '3 hours'),
    (p2, senior2,  'The mistakes notebook idea is the most useful thing I have read this month.', now() - interval '1 days'),
    (p4, junior2,  'Was the SQL round on paper or on a shared editor?', now() - interval '4 days'),
    (p4, senior2,  'Shared editor. They care more about how you explain the join than about the syntax.', now() - interval '4 days' + interval '2 hours'),
    (p6, junior1,  'How did you ask for the referral? I never know what to write in that first message.', now() - interval '8 days'),
    (p6, senior3,  'Two lines about what I had built, the exact role link, and a clear ask. Send me a connect request and I will share what I wrote.', now() - interval '8 days' + interval '5 hours'),
    (p3, senior1,  'Did you use the free tier for all the hands-on work, or did you end up paying for anything?', now() - interval '3 days'),
    (p7, junior2,  'Are guesstimates asked for the analytics role only, or for the technology roles too?', now() - interval '10 days'),
    (p9, junior1,  'Which vocabulary list did you use in the end?', now() - interval '15 days');

  -- 5. Connect requests: one waiting, two accepted, one declined.
  insert into public.connect_requests (post_id, requester_id, recipient_id, created_at) values
    (p1, junior2, senior1,  now() - interval '4 hours'),
    (p6, junior1, senior3,  now() - interval '7 days'),
    (p2, junior1, alumna1,  now() - interval '2 days'),
    (p3, senior1, alumnus2, now() - interval '3 days');

  update public.connect_requests set status = 'accepted' where requester_id = junior1 and post_id in (p6, p2);
  update public.connect_requests set status = 'declined' where requester_id = senior1 and post_id = p3;

  -- 6. One flagged experience for the admin dashboard.
  insert into public.post_reports (post_id, reporter_id, reason, created_at) values
    (p9, junior2, 'The score mentioned here does not match what the author told our batch. Please check before others rely on it.', now() - interval '1 days');

  -- 7. Older notifications read, recent ones unread, so the bell shows a count.
  update public.notifications set is_read = true
  where user_id in (senior1, senior2, senior3, junior1, junior2, alumna1, alumnus2)
    and id not in (
      select id from public.notifications
      where user_id in (senior1, senior3, junior1, alumna1)
      order by created_at desc, id
      limit 6
    );

  raise notice 'Demo data added: 9 members, 10 experiences, 14 comments, 4 connect requests, 1 report.';
end;
$demo$;

-- Sign-in emails (password at the top of this file):
--   demo.senior1@mitwpu.edu.in   Aditya Kulkarni    senior, has a connect request waiting
--   demo.senior2@mitwpu.edu.in   Sneha Patil        senior
--   demo.senior3@mitwpu.edu.in   Rohan Joshi        senior, accepted a connection
--   demo.junior1@mitwpu.edu.in   Ananya Deshpande   junior, two accepted connections
--   demo.junior2@mitwpu.edu.in   Kabir Shah         junior, one request pending
--   demo.alumna1@example.com     Meera Iyer         verified alumna
--   demo.alumnus2@example.com    Vikram Nair        verified alumnus
--   demo.alumnus3@example.com    Arjun Mehta        alumnus waiting for verification
--   demo.alumna4@example.com     Pooja Rao          alumna waiting for verification
--
-- There is no demo administrator on purpose. Promote your own account:
--   update public.profiles set role = 'admin', verification_status = 'not_required'
--   where email = 'you@mitwpu.edu.in';
