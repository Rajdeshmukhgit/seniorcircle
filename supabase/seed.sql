-- Sample experiences for a fresh database.
--
-- Run this AFTER the migration and AFTER at least one person who can post has
-- signed up (a senior, a verified alumnus or an admin). Every sample post is
-- attributed to that account, so you can edit or delete them from the app.
-- Running it twice does nothing: it stops if any experience already exists.

do $$
declare
  author uuid;
begin
  if exists (select 1 from public.posts) then
    raise notice 'Experiences already exist. Seed skipped.';
    return;
  end if;

  select id into author
  from public.profiles
  where role in ('admin', 'senior')
     or (role = 'alumni' and verification_status = 'verified')
  order by (role = 'admin') desc, created_at
  limit 1;

  if author is null then
    raise exception 'Sign up first: the seed needs one admin, senior or verified alumni account to own the sample posts.';
  end if;

  insert into public.posts
    (author_id, title, company_or_exam, category, role, branch, graduation_year, tags, description, created_at, updated_at)
  values
    (author, $seed$Barclays Software Engineer Interview Experience$seed$, $seed$Barclays$seed$, 'interview', $seed$Software Engineer$seed$, $seed$Computer Engineering$seed$, 2027,
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
    (author, $seed$GATE CSE Preparation Experience: AIR 412 Alongside Final Year$seed$, $seed$GATE$seed$, 'exam', $seed$CSE$seed$, $seed$Information Technology$seed$, 2024,
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
    (author, $seed$AWS Solutions Architect Associate Certification Journey$seed$, $seed$AWS Certification$seed$, 'certification', $seed$Solutions Architect Associate$seed$, $seed$Electronics$seed$, 2025,
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
    (author, $seed$Mastercard Internship Interview Experience$seed$, $seed$Mastercard$seed$, 'internship', $seed$Software Engineering Intern$seed$, $seed$AI & Data Science$seed$, 2027,
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
    (author, $seed$CAT Preparation Strategy for Engineers With a Full Timetable$seed$, $seed$CAT$seed$, 'exam', $seed$MBA entrance$seed$, $seed$Information Technology$seed$, 2024,
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
    (author, $seed$PhonePe SDE Intern: Three Rounds in One Day$seed$, $seed$PhonePe$seed$, 'internship', $seed$SDE Intern$seed$, $seed$Information Technology$seed$, 2028,
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
    (author, $seed$ZS Associates Decision Analytics Associate Interview$seed$, $seed$ZS Associates$seed$, 'interview', $seed$Decision Analytics Associate$seed$, $seed$AI & Data Science$seed$, 2027,
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
    (author, $seed$Siemens Graduate Trainee Engineer: Core Electronics Interview$seed$, $seed$Siemens$seed$, 'interview', $seed$Graduate Trainee Engineer$seed$, $seed$Electronics$seed$, 2025,
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
    (author, $seed$GRE in Eight Weeks: 326 With a Day Job$seed$, $seed$GRE$seed$, 'exam', $seed$MS applications$seed$, $seed$Electronics$seed$, 2025,
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
    (author, $seed$Barclays Summer Internship: What the Technical Round Looked Like$seed$, $seed$Barclays$seed$, 'internship', $seed$Technology Intern$seed$, $seed$Information Technology$seed$, 2028,
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
end;
$$;
