import { Mail, MapPin } from "lucide-react";
import Link from "next/link";
import { COLLEGE_NAME, CONTACT_EMAIL, SITE_MISSION, SITE_NAME } from "@/lib/constants/site";
import { LogoMark, Wordmark } from "./Logo";

const quickLinks = [
  { href: "/feed", label: "Experiences" },
  { href: "/trending", label: "Trending" },
  { href: "/experiences/new", label: "Share Experience" },
  { href: "/about#help", label: "Help" },
  { href: "/about", label: "About" },
];

const communityLinks = [
  { href: "/auth/signup", label: "Join as a student" },
  { href: "/auth/signup?type=alumni", label: "Join as alumni" },
  { href: "/about#guidelines", label: "Community guidelines" },
  { href: "/connections", label: "Your connections" },
];

const heading = "font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-faint";
const link = "text-strong transition-colors hover:text-primary-text";

export function Footer() {
  return (
    <footer className="px-2.5 pb-2.5 pt-3 sm:px-4 sm:pb-4 sm:pt-4">
      <div className="glass mx-auto max-w-wide overflow-hidden rounded-panel px-5 pt-14 shadow-card sm:px-10 lg:px-14">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-12">
          <div className="space-y-5 lg:col-span-4">
            <Link href="/" className="flex items-center gap-2.5 font-bold tracking-tight text-ink">
              <LogoMark size={36} />
              <Wordmark className="text-xl" />
            </Link>
            <p className="max-w-sm text-[15px] leading-relaxed text-soft">{SITE_MISSION}</p>
          </div>

          <div className="space-y-5 lg:col-span-2 lg:ml-auto">
            <h3 className={heading}>Quick Links</h3>
            <ul className="space-y-3.5 text-[15px] font-medium">
              {quickLinks.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className={link}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-5 lg:col-span-3 lg:ml-auto">
            <h3 className={heading}>Community</h3>
            <ul className="space-y-3.5 text-[15px] font-medium">
              {communityLinks.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className={link}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-5 lg:col-span-3">
            <h3 className={heading}>Contact</h3>
            <div className="space-y-4 text-[15px] font-medium text-soft">
              <div className="flex items-start gap-3.5">
                <span className="shape-cut mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center bg-primary/10 text-primary-text [--cut:8px] [--r:9px]">
                  <MapPin className="h-4 w-4" aria-hidden />
                </span>
                <span className="leading-relaxed">
                  {COLLEGE_NAME} campus
                  <br />
                  Student coordinator desk
                </span>
              </div>
              <a href={`mailto:${CONTACT_EMAIL}`} className="flex items-center gap-3.5 transition-colors hover:text-ink">
                <span className="shape-cut flex h-8 w-8 shrink-0 items-center justify-center bg-primary/10 text-primary-text [--cut:8px] [--r:9px]">
                  <Mail className="h-4 w-4" aria-hidden />
                </span>
                <span className="break-all">{CONTACT_EMAIL}</span>
              </a>
            </div>
          </div>
        </div>

        <div
          aria-hidden
          className="pointer-events-none mt-14 select-none bg-gradient-to-b from-primary/35 to-primary/0 bg-clip-text font-display text-[16.5vw] font-semibold leading-[0.82] tracking-[-0.07em] text-transparent 2xl:text-[250px]"
        >
          {SITE_NAME}
        </div>

        <div className="flex flex-col gap-2 border-t border-hairline py-6 text-[13.5px] text-faint sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {SITE_NAME}. For the {COLLEGE_NAME} student community.
          </p>
          <p>Built by students as a PBL III project.</p>
        </div>
      </div>
    </footer>
  );
}
