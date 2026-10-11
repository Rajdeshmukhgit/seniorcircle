import { SITE_NAME } from "@/lib/constants/site";

const steps = [
  {
    title: "Read",
    text: "Seniors and alumni write up an interview, internship, exam or certification they went through. Search it by company, branch or year.",
  },
  {
    title: "Ask",
    text: "Questions go in the comments under each experience, so everyone who comes after benefits from the answer.",
  },
  {
    title: "Connect",
    text: "For a longer conversation, send the author a connect request. If they accept, you each see the other's email.",
  },
];

/** The three basics, drawn as hairline columns that bevel at the top-right corner. */
export function HowItWorks() {
  return (
    <section id="how-it-works" className="px-2.5 pt-3 sm:px-4 sm:pt-4">
      <div className="glass mx-auto max-w-wide rounded-panel px-5 py-12 shadow-card sm:px-10 sm:py-16 lg:px-14">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:gap-12">
          <div>
            <p className="eyebrow">How it works</p>
            <h2 className="heading-section mt-4 max-w-[380px]">The basics of {SITE_NAME}</h2>
          </div>

          <ol className="grid gap-4 sm:grid-cols-3 sm:gap-0">
            {steps.map((step, index) => (
              <li
                key={step.title}
                className="shape-cut-tr flex min-h-[170px] flex-col border-r border-t border-line pr-6 pt-7 sm:min-h-[260px] sm:pt-8 [--cut:44px] [--r:0px] sm:ml-5 sm:first:ml-0"
              >
                <h3 className="font-display text-[30px] font-semibold leading-none tracking-[-0.05em] text-ink">{step.title}</h3>
                <div className="mt-auto grid grid-cols-[auto_1fr] gap-x-4 pt-6 sm:pt-10">
                  <span className="font-mono text-[11.5px] text-faint">{String(index + 1).padStart(2, "0")}</span>
                  <p className="text-[14px] leading-[1.55] text-soft">{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
