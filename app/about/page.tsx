import type { Metadata } from "next";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/Button";
import { COLLEGE_NAME, CONTACT_EMAIL, SITE_NAME } from "@/lib/constants/site";

export const metadata: Metadata = { title: "About and help" };

const h2 = "font-display text-[24px] font-semibold leading-tight tracking-[-0.035em] text-ink";
const p = "mt-3 text-[16px] leading-[1.75] text-strong";
const link = "font-semibold text-primary-text hover:underline";

const roles = [
  {
    name: "Juniors",
    text: "Current students in their first two years. Read every experience, ask questions in the comments, and send connect requests to authors.",
  },
  {
    name: "Seniors",
    text: "Final-year and pre-final-year students. Everything juniors can do, plus writing experiences and answering connect requests.",
  },
  {
    name: "Alumni",
    text: "Graduates who sign up with a personal email. An administrator verifies each account before it can post, comment or connect.",
  },
  {
    name: "Administrators",
    text: "Student and faculty coordinators who verify alumni and review posts that members flag.",
  },
];

const faqs = [
  {
    q: "Why does student signup need a college email?",
    a: `It is how the platform knows you are a current ${COLLEGE_NAME} student without anyone checking by hand. Graduates use a personal email and are verified by an administrator instead.`,
  },
  {
    q: "I signed up as alumni. Why can't I post?",
    a: "New alumni accounts wait for verification. You can read everything meanwhile, and you get a notification when an administrator decides.",
  },
  {
    q: "What happens when a connect request is accepted?",
    a: "Each of you can see the other's email on the Connections page. There is no chat inside the platform in this version, so the conversation continues over email.",
  },
  {
    q: "How do I format an experience?",
    a: "Start a line with ## for a heading and with - for a list item. Wrap words in ** for bold. Leave a blank line between paragraphs.",
  },
  {
    q: "I forgot my password.",
    a: "Use “Forgot password?” on the sign-in page. A link to set a new one is sent to your email.",
  },
];

export default function AboutPage() {
  return (
    <div className="mx-auto w-full max-w-[760px] px-4 pb-16 pt-24 sm:px-6 md:pt-28">
      <h1 className="font-display text-[34px] font-semibold leading-[1.08] tracking-[-0.055em] text-ink sm:text-[44px]">
        What seniors know, written down.
      </h1>
      <p className="mt-4 text-[17px] leading-[1.6] text-soft">
        Guidance about placements, exams and certifications usually travels by word of mouth, and reaches only the
        juniors who happen to know the right senior. {SITE_NAME} puts it in one place for every {COLLEGE_NAME} student.
      </p>

      <section className="mt-12" aria-labelledby="how">
        <h2 id="how" className={h2}>
          How it works
        </h2>
        <ol className="mt-4 list-decimal space-y-2.5 pl-6 text-[16px] leading-[1.75] text-strong marker:font-semibold marker:text-primary-text">
          <li>Seniors and alumni write up an interview, internship, exam or certification they went through.</li>
          <li>Juniors search and filter by company or exam, branch and graduation year.</li>
          <li>Questions go in the comments, where everyone benefits from the answer.</li>
          <li>For a longer conversation, a junior sends a connect request and the author accepts or declines.</li>
        </ol>
      </section>

      <section className="mt-12" aria-labelledby="roles">
        <h2 id="roles" className={h2}>
          Who can do what
        </h2>
        <dl className="mt-4 divide-y divide-hairline rounded-card border border-line bg-card">
          {roles.map((role) => (
            <div key={role.name} className="grid gap-1 px-[22px] py-4 sm:grid-cols-[140px_1fr] sm:gap-4">
              <dt className="text-[14.5px] font-bold text-ink">{role.name}</dt>
              <dd className="text-[14.5px] leading-relaxed text-soft">{role.text}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mt-12 scroll-mt-24" id="guidelines" aria-labelledby="guidelines-heading">
        <h2 id="guidelines-heading" className={h2}>
          Community guidelines
        </h2>
        <ul className="mt-4 list-disc space-y-2.5 pl-6 text-[16px] leading-[1.75] text-strong marker:text-primary-text">
          <li>Write what happened to you. Do not post second-hand accounts as your own.</li>
          <li>Share the kinds of questions asked, not confidential test papers or anything under an NDA.</li>
          <li>Leave out other people&apos;s names, phone numbers and personal details.</li>
          <li>Be kind in comments. Every author is doing juniors a favour.</li>
          <li>See something that breaks these? Use “Report this post” at the bottom of the experience.</li>
        </ul>
      </section>

      <section className="mt-12 scroll-mt-24" id="help" aria-labelledby="help-heading">
        <h2 id="help-heading" className={h2}>
          Help
        </h2>
        <div className="mt-4 divide-y divide-hairline border-y border-hairline">
          {faqs.map((faq) => (
            <details key={faq.q} className="group py-4">
              <summary className="cursor-pointer list-none text-[15.5px] font-semibold text-ink marker:hidden group-open:text-primary-text">
                {faq.q}
              </summary>
              <p className="mt-2 text-[15px] leading-relaxed text-soft">{faq.a}</p>
            </details>
          ))}
        </div>
        <p className={p}>
          Still stuck? Write to{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className={link}>
            {CONTACT_EMAIL}
          </a>{" "}
          or see the{" "}
          <Link href="/feed" className={link}>
            latest experiences
          </Link>
          .
        </p>
      </section>

      <div className="mt-10 flex flex-wrap gap-2.5">
        <ButtonLink href="/feed" variant="primary" size="lg">
          Explore Experiences
        </ButtonLink>
        <ButtonLink href="/auth/signup" variant="invert" size="lg">
          Join the community
        </ButtonLink>
      </div>
    </div>
  );
}
