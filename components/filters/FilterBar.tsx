"use client";

import { Building2, ChevronDown, GraduationCap, Layers, SlidersHorizontal, X, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BRANCHES, CATEGORIES, CATEGORY_LABEL } from "@/lib/constants/options";
import { feedUrl, hasActiveFilters } from "@/lib/data/filters";
import { cn } from "@/lib/utils";
import type { Category, FeedFilters } from "@/types";

interface FilterBarProps {
  filters: FeedFilters;
  companies: string[];
  years: number[];
}

interface SelectProps {
  id: string;
  label: string;
  icon: LucideIcon;
  value: string;
  placeholder: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}

function FilterSelect({ id, label, icon: Icon, value, placeholder, options, onChange }: SelectProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="flex items-center gap-1.5 text-[12.5px] font-bold text-faint">
        <Icon className="h-3.5 w-3.5" aria-hidden />
        {label}
      </label>
      <div className="relative">
        <select suppressHydrationWarning
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={cn(
            "shape-cut h-10 w-full appearance-none border border-line bg-chip [--cut:10px] [--r:11px] pl-3 pr-9 text-[16px] font-medium outline-none sm:text-[13.5px] transition focus:border-primary focus:ring-4 focus:ring-primary/10",
            value ? "text-ink" : "text-soft",
          )}
        >
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" aria-hidden />
      </div>
    </div>
  );
}

/** The "Refine the feed" panel. Every control rewrites the URL, and the server re-queries. */
export function FilterBar({ filters, companies, years }: FilterBarProps) {
  const router = useRouter();
  const active = hasActiveFilters(filters);
  // On phones the panel starts collapsed unless a filter is already applied.
  const [open, setOpen] = useState(Boolean(filters.company || filters.category || filters.branch || filters.year));

  const update = (patch: Partial<FeedFilters>) => router.push(feedUrl({ ...filters, ...patch }), { scroll: false });

  const chips: { label: string; clear: Partial<FeedFilters> }[] = [
    filters.q ? { label: `“${filters.q}”`, clear: { q: undefined } } : null,
    filters.company ? { label: filters.company, clear: { company: undefined } } : null,
    filters.category ? { label: CATEGORY_LABEL[filters.category], clear: { category: undefined } } : null,
    filters.branch ? { label: filters.branch, clear: { branch: undefined } } : null,
    filters.year ? { label: `Class of ${filters.year}`, clear: { year: undefined } } : null,
  ].filter((chip) => chip !== null);

  return (
    <section aria-label="Filters" className="rounded-card border border-line bg-card [--cut:20px] [--r:16px] p-4">
      <div className="flex items-center justify-between gap-3">
        <button suppressHydrationWarning
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls="feed-filters"
          className="flex items-center gap-2.5 sm:pointer-events-none"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center shape-cut bg-primary/10 text-primary-text [--cut:8px] [--r:9px]">
            <SlidersHorizontal className="h-4 w-4" aria-hidden />
          </span>
          <span className="text-sm font-bold text-ink">Refine the feed</span>
          <ChevronDown className={cn("h-4 w-4 text-faint transition-transform sm:hidden", open && "rotate-180")} aria-hidden />
        </button>
        {active && (
          <Link
            href={feedUrl({ sort: filters.sort })}
            scroll={false}
            className="shape-cut inline-flex items-center gap-1 border border-line px-3 py-1 [--cut:7px] [--r:8px] text-[12.5px] font-semibold text-soft hover:border-faint hover:text-ink"
          >
            <X className="h-3.5 w-3.5" aria-hidden />
            Clear filters
          </Link>
        )}
      </div>

      <div id="feed-filters" className={cn("mt-4 grid-cols-2 gap-3 border-t border-hairline pt-4 sm:grid lg:grid-cols-4", open ? "grid" : "hidden")}>
        <FilterSelect
          id="filter-company"
          label="Company or exam"
          icon={Building2}
          value={filters.company && companies.find((c) => c.toLowerCase() === filters.company!.toLowerCase()) || filters.company || ""}
          placeholder="All"
          options={[
            ...(filters.company && !companies.some((c) => c.toLowerCase() === filters.company!.toLowerCase())
              ? [{ value: filters.company, label: filters.company }]
              : []),
            ...companies.map((company) => ({ value: company, label: company })),
          ]}
          onChange={(value) => update({ company: value || undefined })}
        />
        <FilterSelect
          id="filter-category"
          label="Type"
          icon={Layers}
          value={filters.category ?? ""}
          placeholder="All types"
          options={CATEGORIES.map((category) => ({ value: category.value, label: category.label }))}
          onChange={(value) => update({ category: (value || undefined) as Category | undefined })}
        />
        <FilterSelect
          id="filter-branch"
          label="Branch"
          icon={GraduationCap}
          value={filters.branch ?? ""}
          placeholder="All branches"
          options={BRANCHES.map((branch) => ({ value: branch, label: branch }))}
          onChange={(value) => update({ branch: value || undefined })}
        />
        <FilterSelect
          id="filter-year"
          label="Graduation year"
          icon={GraduationCap}
          value={filters.year ? String(filters.year) : ""}
          placeholder="All years"
          options={years.map((year) => ({ value: String(year), label: String(year) }))}
          onChange={(value) => update({ year: value ? Number(value) : undefined })}
        />
      </div>

      {chips.length > 0 && (
        <ul aria-label="Active filters" className="mt-3 flex flex-wrap gap-1.5">
          {chips.map((chip) => (
            <li key={chip.label}>
              <Link
                href={feedUrl({ ...filters, ...chip.clear })}
                scroll={false}
                className="shape-cut inline-flex items-center gap-1 bg-primary/10 py-1 [--cut:7px] [--r:8px] pl-3 pr-2 text-[12.5px] font-semibold text-primary-text hover:bg-primary/15"
              >
                {chip.label}
                <X className="h-3.5 w-3.5" aria-hidden />
                <span className="sr-only">Remove filter</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
