/**
 * Demo data used while Supabase is not connected (see lib/config.ts).
 * supabase/seed.sql carries the same experiences for a real database.
 */
import type {
  Category,
  ConnectStatus,
  NotificationType,
  Outcome,
  PostInsights,
  Profile,
  ReportStatus,
} from "@/types";

const DAY = 24 * 60 * 60 * 1000;

function daysAgo(days: number, hours = 0): string {
  return new Date(Date.now() - days * DAY - hours * 60 * 60 * 1000).toISOString();
}

export interface SeedVote {
  post_id: string;
  voter_id: string;
  value: -1 | 1;
}

export interface SeedPost {
  id: string;
  author_id: string;
  title: string;
  company_or_exam: string;
  description: string;
  category: Category;
  role: string | null;
  branch: string;
  graduation_year: number;
  tags: string[];
  created_at: string;
  updated_at: string;
  /** Normally written by the enrichment pipeline. Left off in the demo data. */
  insights?: PostInsights | null;
  topics?: string[];
  difficulty?: number | null;
  round_count?: number | null;
  outcome?: Outcome | null;
}

export interface SeedComment {
  id: string;
  post_id: string;
  author_id: string;
  body: string;
  created_at: string;
}

export interface SeedConnect {
  id: string;
  post_id: string;
  requester_id: string;
  recipient_id: string;
  status: ConnectStatus;
  created_at: string;
  updated_at: string;
}

export interface SeedNotification {
  id: string;
  user_id: string;
  type: NotificationType;
  reference_id: string | null;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface SeedReport {
  id: string;
  post_id: string;
  reporter_id: string;
  reason: string;
  status: ReportStatus;
  created_at: string;
}

const DOMAIN = "mitwpu.edu.in";

export const seedProfiles: Profile[] = [
  {
    id: "u-admin",
    email: `meera.joglekar@${DOMAIN}`,
    role: "admin",
    verification_status: "not_required",
    name: "Meera Joglekar",
    branch: "Computer Engineering",
    graduation_year: 2012,
    created_at: daysAgo(120),
  },
  {
    id: "u-aarav",
    email: `aarav.patil@${DOMAIN}`,
    role: "senior",
    verification_status: "not_required",
    name: "Aarav Patil",
    branch: "Computer Engineering",
    graduation_year: 2027,
    created_at: daysAgo(90),
  },
  {
    id: "u-sneha",
    email: "sneha.kulkarni@gmail.com",
    role: "alumni",
    verification_status: "verified",
    name: "Sneha Kulkarni",
    branch: "Information Technology",
    graduation_year: 2024,
    created_at: daysAgo(85),
  },
  {
    id: "u-aditya",
    email: `aditya.joshi@${DOMAIN}`,
    role: "senior",
    verification_status: "not_required",
    name: "Aditya Joshi",
    branch: "AI & Data Science",
    graduation_year: 2027,
    created_at: daysAgo(80),
  },
  {
    id: "u-riya",
    email: `riya.deshmukh@${DOMAIN}`,
    role: "junior",
    verification_status: "not_required",
    name: "Riya Deshmukh",
    branch: "Computer Engineering",
    graduation_year: 2029,
    created_at: daysAgo(40),
  },
  {
    id: "u-atharva",
    email: "atharva.shah@outlook.com",
    role: "alumni",
    verification_status: "pending",
    name: "Atharva Shah",
    branch: "Electronics",
    graduation_year: 2023,
    created_at: daysAgo(2),
  },
  {
    id: "u-tanvi",
    email: "tanvi.bhosale@gmail.com",
    role: "alumni",
    verification_status: "verified",
    name: "Tanvi Bhosale",
    branch: "Electronics",
    graduation_year: 2025,
    created_at: daysAgo(70),
  },
  {
    id: "u-kunal",
    email: `kunal.more@${DOMAIN}`,
    role: "senior",
    verification_status: "not_required",
    name: "Kunal More",
    branch: "Information Technology",
    graduation_year: 2028,
    created_at: daysAgo(60),
  },
  {
    id: "u-isha",
    email: `isha.gokhale@${DOMAIN}`,
    role: "junior",
    verification_status: "not_required",
    name: "Isha Gokhale",
    branch: "AI & Data Science",
    graduation_year: 2030,
    created_at: daysAgo(20),
  },
  {
    id: "u-pranav",
    email: "pranav.kale@yahoo.com",
    role: "alumni",
    verification_status: "pending",
    name: "Pranav Kale",
    branch: "Computer Engineering",
    graduation_year: 2022,
    created_at: daysAgo(1),
  },
];

/** The one-click accounts offered on the demo sign-in page. */
export const demoPersonas: { id: string; blurb: string }[] = [
  { id: "u-riya", blurb: "Second-year student. Can read, comment and send connect requests." },
  { id: "u-aarav", blurb: "Final-year student with posts and incoming requests." },
  { id: "u-sneha", blurb: "Verified alumna. Can post and accept requests." },
  { id: "u-atharva", blurb: "Alumnus waiting for verification. Read-only." },
  { id: "u-admin", blurb: "Coordinator. Reviews alumni and flagged posts." },
];

export const seedPosts: SeedPost[] = [
  {
    id: "p-barclays",
    author_id: "u-aarav",
    title: "Barclays Software Engineer Interview Experience",
    company_or_exam: "Barclays",
    category: "interview",
    role: "Software Engineer",
    branch: "Computer Engineering",
    graduation_year: 2027,
    tags: ["on-campus", "dsa", "dbms"],
    created_at: daysAgo(1, 3),
    updated_at: daysAgo(1, 3),
    description: `Barclays visited campus in the first week of September. Around 310 students sat the online assessment, 42 were shortlisted and 11 got offers.

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
- Keep one project I can explain end to end, including what went wrong`,
  },
  {
    id: "p-gate",
    author_id: "u-sneha",
    title: "GATE CSE Preparation Experience: AIR 412 Alongside Final Year",
    company_or_exam: "GATE",
    category: "exam",
    role: "CSE",
    branch: "Information Technology",
    graduation_year: 2024,
    tags: ["gate", "self-study", "timetable"],
    created_at: daysAgo(3, 5),
    updated_at: daysAgo(3, 5),
    description: `I prepared for GATE CSE through my final year without leaving placements, and finished at AIR 412. This is the plan I actually followed, not the one I wrote in June.

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
Your regular semester subjects are most of the GATE syllabus. If you study TOC, OS and DBMS properly when they are taught, the final year becomes revision instead of first contact.`,
  },
  {
    id: "p-aws",
    author_id: "u-tanvi",
    title: "AWS Solutions Architect Associate Certification Journey",
    company_or_exam: "AWS Certification",
    category: "certification",
    role: "Solutions Architect Associate",
    branch: "Electronics",
    graduation_year: 2025,
    tags: ["cloud", "aws", "six-weeks"],
    created_at: daysAgo(5, 2),
    updated_at: daysAgo(5, 2),
    description: `I come from Electronics and had no cloud background. I passed SAA-C03 with 812 after six weeks of evening study while working full time.

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
It did not get me a job by itself. It did give me vocabulary for interviews and made my final-year project deployable. If you are in third year, do the hands-on part even if you skip the exam.`,
  },
  {
    id: "p-mastercard",
    author_id: "u-aditya",
    title: "Mastercard Internship Interview Experience",
    company_or_exam: "Mastercard",
    category: "internship",
    role: "Software Engineering Intern",
    branch: "AI & Data Science",
    graduation_year: 2027,
    tags: ["on-campus", "internship", "sql"],
    created_at: daysAgo(6, 6),
    updated_at: daysAgo(6, 6),
    description: `Mastercard hired summer interns from third year. The process took two days: an online test, one technical interview and one managerial interview.

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
Know your project beyond the notebook. Deployment, monitoring and failure cases came up in every panel my friends sat in as well.`,
  },
  {
    id: "p-cat",
    author_id: "u-sneha",
    title: "CAT Preparation Strategy for Engineers With a Full Timetable",
    company_or_exam: "CAT",
    category: "exam",
    role: "MBA entrance",
    branch: "Information Technology",
    graduation_year: 2024,
    tags: ["cat", "mba", "varc"],
    created_at: daysAgo(9, 4),
    updated_at: daysAgo(9, 4),
    description: `I wrote CAT in my final year and scored 98.6 percentile. Quant was comfortable as an engineer. Reading comprehension was not.

## Section by section
- **VARC:** one long article every day from a newspaper editorial page, then two RC sets. This took four months to show results
- **DILR:** set selection is the whole game. I practised choosing two sets out of four in the first five minutes
- **Quant:** arithmetic and algebra are most of the paper. I skipped the hardest geometry

## Mocks
I took 28 mocks. The score only started moving after I spent twice as long analysing each mock as writing it.

## If you are in third year
Start reading now. Nothing else needs a year.`,
  },
  {
    id: "p-phonepe",
    author_id: "u-kunal",
    title: "PhonePe SDE Intern: Three Rounds in One Day",
    company_or_exam: "PhonePe",
    category: "internship",
    role: "SDE Intern",
    branch: "Information Technology",
    graduation_year: 2028,
    tags: ["off-campus", "dsa", "machine-coding"],
    created_at: daysAgo(11, 1),
    updated_at: daysAgo(11, 1),
    description: `I applied off-campus through a referral from a senior I met at a college hackathon. The whole loop ran in one day over video.

## Round 1: DSA
- Find the kth largest element in a stream
- Lowest common ancestor in a binary tree, then the same for a general tree

## Round 2: machine coding
Ninety minutes to build an in-memory splitwise-style expense tracker. They ran my code against their own cases at the end. Clean function names and handling bad input counted.

## Round 3: hiring manager
Design discussion about how I would store transaction history for fast lookups, followed by questions on why I picked my tech stack.

## What helped
- Practising machine coding with a timer. It is a different skill from DSA
- Asking for the referral. Seniors say yes more often than you expect`,
  },
  {
    id: "p-zs",
    author_id: "u-aditya",
    title: "ZS Associates Decision Analytics Associate Interview",
    company_or_exam: "ZS Associates",
    category: "interview",
    role: "Decision Analytics Associate",
    branch: "AI & Data Science",
    graduation_year: 2027,
    tags: ["on-campus", "case-study", "aptitude"],
    created_at: daysAgo(14, 2),
    updated_at: daysAgo(14, 2),
    description: `ZS runs a process that is unlike product companies. There is very little DSA and a lot of structured thinking.

## Aptitude and video round
- Quant, logical reasoning and reading comprehension with tight sectional timers
- A recorded video round with three behavioural prompts

## Case interview
I was asked to estimate the number of insulin pens sold in Pune in a year. State your assumptions aloud and keep the arithmetic simple. The interviewer changed one assumption midway to see whether my structure held.

## Technical and HR
Basic SQL joins, one probability question, and a conversation about why analytics over development.

## Advice
Practise five or six guesstimates aloud with a friend. Thinking silently for two minutes is the most common reason people were rejected.`,
  },
  {
    id: "p-siemens",
    author_id: "u-tanvi",
    title: "Siemens Graduate Trainee Engineer: Core Electronics Interview",
    company_or_exam: "Siemens",
    category: "interview",
    role: "Graduate Trainee Engineer",
    branch: "Electronics",
    graduation_year: 2025,
    tags: ["on-campus", "core", "embedded"],
    created_at: daysAgo(18, 3),
    updated_at: daysAgo(18, 3),
    description: `For Electronics students who want a core role: Siemens asked real fundamentals, and the students who had revised second-year subjects did best.

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
Keep your lab manuals. Half my questions were experiments we had done in fourth semester.`,
  },
  {
    id: "p-gre",
    author_id: "u-tanvi",
    title: "GRE in Eight Weeks: 326 With a Day Job",
    company_or_exam: "GRE",
    category: "exam",
    role: "MS applications",
    branch: "Electronics",
    graduation_year: 2025,
    tags: ["gre", "ms", "vocabulary"],
    created_at: daysAgo(22, 5),
    updated_at: daysAgo(22, 5),
    description: `Score: 326 (Quant 168, Verbal 158, AWA 4.0). I studied for eight weeks, about ninety minutes on weekdays.

## Plan
- **Weeks 1 to 3:** vocabulary in context. Thirty words a day with a sentence each, reviewed on the bus
- **Weeks 4 to 6:** official practice sets, one section a day
- **Weeks 7 and 8:** four full-length tests at the same time of day as my slot

## Notes
- Quant is school maths with traps. Read the last line of every question twice
- For verbal, official material is the only thing that matches the real test
- Write at least four timed essays before the exam

Book your slot first. A date on the calendar did more for my discipline than any plan.`,
  },
  {
    id: "p-barclays-intern",
    author_id: "u-kunal",
    title: "Barclays Summer Internship: What the Technical Round Looked Like",
    company_or_exam: "Barclays",
    category: "internship",
    role: "Technology Intern",
    branch: "Information Technology",
    graduation_year: 2028,
    tags: ["on-campus", "internship", "java"],
    created_at: daysAgo(27, 2),
    updated_at: daysAgo(27, 2),
    description: `The internship drive opens to third-year students. Shortlisting was on the online test alone.

## Online test
Two coding questions and aptitude. Both questions were array based and medium.

## Technical plus HR round
One combined round of about forty minutes.

- Reverse a linked list in groups of K
- Explain how HashMap works in Java and what happens on a collision
- Why banking technology, and what I knew about the team's work in Pune

## Advice
Core Java gets asked more than people expect here. Collections, exceptions and the difference between an interface and an abstract class all came up.`,
  },
];

export const seedComments: SeedComment[] = [
  {
    id: "c-1",
    post_id: "p-barclays",
    author_id: "u-riya",
    body: "Thank you for the parking lot detail. Did they expect code for it or only the class design?",
    created_at: daysAgo(0, 20),
  },
  {
    id: "c-2",
    post_id: "p-barclays",
    author_id: "u-aarav",
    body: "Only the design. I wrote class names and method signatures on a shared doc and talked through one flow.",
    created_at: daysAgo(0, 18),
  },
  {
    id: "c-3",
    post_id: "p-barclays",
    author_id: "u-kunal",
    body: "Same pattern in the intern drive last year. The index question came up for me as well.",
    created_at: daysAgo(0, 9),
  },
  {
    id: "c-4",
    post_id: "p-gate",
    author_id: "u-isha",
    body: "The point about semester subjects is reassuring. Which test series did you finish in the end?",
    created_at: daysAgo(2, 6),
  },
  {
    id: "c-5",
    post_id: "p-gate",
    author_id: "u-riya",
    body: "Saving this. I start TOC next semester.",
    created_at: daysAgo(2, 1),
  },
  {
    id: "c-6",
    post_id: "p-aws",
    author_id: "u-aditya",
    body: "Breaking the setup on purpose is a good idea. Did the free tier cover the whole three-tier build?",
    created_at: daysAgo(4, 3),
  },
  {
    id: "c-7",
    post_id: "p-mastercard",
    author_id: "u-riya",
    body: "How much SQL should a second-year know before applying for internships like this?",
    created_at: daysAgo(5, 8),
  },
  {
    id: "c-8",
    post_id: "p-phonepe",
    author_id: "u-isha",
    body: "I had not heard of machine coding rounds before this. Is there a list of problems you practised?",
    created_at: daysAgo(10, 2),
  },
];

export const seedConnects: SeedConnect[] = [
  {
    id: "r-1",
    post_id: "p-barclays",
    requester_id: "u-isha",
    recipient_id: "u-aarav",
    status: "pending",
    created_at: daysAgo(0, 6),
    updated_at: daysAgo(0, 6),
  },
  {
    id: "r-2",
    post_id: "p-gate",
    requester_id: "u-riya",
    recipient_id: "u-sneha",
    status: "accepted",
    created_at: daysAgo(2, 4),
    updated_at: daysAgo(1, 20),
  },
  {
    id: "r-3",
    post_id: "p-phonepe",
    requester_id: "u-riya",
    recipient_id: "u-kunal",
    status: "pending",
    created_at: daysAgo(1, 2),
    updated_at: daysAgo(1, 2),
  },
];

export const seedNotifications: SeedNotification[] = [
  {
    id: "n-1",
    user_id: "u-aarav",
    type: "connect_request",
    reference_id: "r-1",
    message: "Isha Gokhale wants to connect about “Barclays Software Engineer Interview Experience”.",
    is_read: false,
    created_at: daysAgo(0, 6),
  },
  {
    id: "n-2",
    user_id: "u-aarav",
    type: "comment",
    reference_id: "p-barclays",
    message: "Kunal More commented on “Barclays Software Engineer Interview Experience”.",
    is_read: false,
    created_at: daysAgo(0, 9),
  },
  {
    id: "n-3",
    user_id: "u-aarav",
    type: "comment",
    reference_id: "p-barclays",
    message: "Riya Deshmukh commented on “Barclays Software Engineer Interview Experience”.",
    is_read: true,
    created_at: daysAgo(0, 20),
  },
  {
    id: "n-4",
    user_id: "u-riya",
    type: "connect_accepted",
    reference_id: "r-2",
    message: "Sneha Kulkarni accepted your connect request.",
    is_read: false,
    created_at: daysAgo(1, 20),
  },
  {
    id: "n-5",
    user_id: "u-sneha",
    type: "comment",
    reference_id: "p-gate",
    message: "Riya Deshmukh commented on “GATE CSE Preparation Experience: AIR 412 Alongside Final Year”.",
    is_read: false,
    created_at: daysAgo(2, 1),
  },
  {
    id: "n-6",
    user_id: "u-sneha",
    type: "verification_approved",
    reference_id: null,
    message: "Your alumni account is verified. You can now share experiences and connect with students.",
    is_read: true,
    created_at: daysAgo(84),
  },
];

export const seedReports: SeedReport[] = [
  {
    id: "f-1",
    post_id: "p-barclays-intern",
    reporter_id: "u-isha",
    reason: "This looks like a duplicate of another Barclays post.",
    status: "open",
    created_at: daysAgo(0, 12),
  },
];

/**
 * Demo votes, so the trending page has something to rank. Nobody votes on
 * their own experience -- the real database forbids it (migration 0002), and
 * the demo data should not show something the live site would reject.
 */
export const seedVotes: SeedVote[] = [
  { post_id: "p-barclays", voter_id: "u-riya", value: 1 },
  { post_id: "p-barclays", voter_id: "u-isha", value: 1 },
  { post_id: "p-barclays", voter_id: "u-pranav", value: 1 },
  { post_id: "p-barclays", voter_id: "u-sneha", value: 1 },
  { post_id: "p-barclays", voter_id: "u-kunal", value: 1 },
  { post_id: "p-barclays", voter_id: "u-atharva", value: -1 },

  { post_id: "p-mastercard", voter_id: "u-riya", value: 1 },
  { post_id: "p-mastercard", voter_id: "u-isha", value: 1 },
  { post_id: "p-mastercard", voter_id: "u-pranav", value: 1 },
  { post_id: "p-mastercard", voter_id: "u-tanvi", value: 1 },

  { post_id: "p-gate", voter_id: "u-riya", value: 1 },
  { post_id: "p-gate", voter_id: "u-pranav", value: 1 },
  { post_id: "p-gate", voter_id: "u-isha", value: 1 },

  { post_id: "p-phonepe", voter_id: "u-riya", value: 1 },
  { post_id: "p-phonepe", voter_id: "u-aarav", value: 1 },

  { post_id: "p-barclays-intern", voter_id: "u-isha", value: 1 },
  { post_id: "p-barclays-intern", voter_id: "u-riya", value: 1 },
  { post_id: "p-barclays-intern", voter_id: "u-pranav", value: 1 },

  { post_id: "p-aws", voter_id: "u-pranav", value: 1 },
  { post_id: "p-aws", voter_id: "u-riya", value: -1 },

  { post_id: "p-zs", voter_id: "u-isha", value: 1 },
  { post_id: "p-cat", voter_id: "u-riya", value: 1 },
  { post_id: "p-siemens", voter_id: "u-pranav", value: 1 },
  { post_id: "p-gre", voter_id: "u-riya", value: -1 },
];
