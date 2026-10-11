import { FilterChip } from "@/components/filters/FilterChip";
import { BRANCHES, CATEGORIES, SUGGESTED_COMPANIES, finalYearBatch } from "@/lib/constants/options";
import type { PostPreview } from "@/types";

interface DiscoverPanelProps {
  companies: string[];
}

/** Companies and exams with the most experiences, topped up with suggestions. */
export function discoverCompanies(previews: PostPreview[]): string[] {
  const counts = new Map<string, number>();
  for (const post of previews) counts.set(post.company_or_exam, (counts.get(post.company_or_exam) ?? 0) + 1);
  const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([name]) => name);
  return [...new Set([...ranked, ...SUGGESTED_COMPANIES])].slice(0, 9);
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-3 border-t border-line py-5 sm:grid-cols-[minmax(150px,210px)_1fr] sm:items-center sm:gap-6">
      <span className="text-[14px] font-semibold text-strong">{label}</span>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

const feed = (key: string, value: string | number) => `/feed?${key}=${encodeURIComponent(String(value))}`;

export function DiscoverPanel({ companies }: DiscoverPanelProps) {
  const top = finalYearBatch();
  const years = Array.from({ length: 7 }, (_, i) => top - i);

  return (
    <section id="discover" className="px-2.5 pt-3 sm:px-4 sm:pt-4">
      <div className="glass mx-auto grid max-w-wide gap-8 rounded-panel px-5 py-12 shadow-card sm:px-10 sm:py-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:gap-12 lg:px-14">
        <div>
          <p className="eyebrow">02 · Discover</p>
          <h2 className="heading-section mt-4 max-w-[420px]">Find experiences that match your goal</h2>
          <p className="mt-3 max-w-[420px] text-[15.5px] leading-relaxed text-soft">
            Filter by company or exam, graduation year, or branch and go straight to the experiences that fit.
          </p>
        </div>

        <div>
          <Row label="By company or exam">
            {companies.map((company) => (
              <FilterChip key={company} href={feed("company", company)}>
                {company}
              </FilterChip>
            ))}
          </Row>
          <Row label="By graduation year">
            {years.map((year) => (
              <FilterChip key={year} href={feed("year", year)}>
                {year}
              </FilterChip>
            ))}
          </Row>
          <Row label="By branch">
            {BRANCHES.slice(0, 4).map((branch) => (
              <FilterChip key={branch} href={feed("branch", branch)}>
                {branch}
              </FilterChip>
            ))}
          </Row>
          <Row label="By type">
            {CATEGORIES.map((category) => (
              <FilterChip key={category.value} href={feed("category", category.value)}>
                {category.label}
              </FilterChip>
            ))}
          </Row>
        </div>
      </div>
    </section>
  );
}
