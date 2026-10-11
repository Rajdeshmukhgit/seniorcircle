import type { Metadata } from "next";
import { ContributeCta } from "@/components/home/ContributeCta";
import { DiscoverPanel, discoverCompanies } from "@/components/home/DiscoverPanel";
import { getRepo } from "@/lib/data";
import type { PostPreview } from "@/types";

export const metadata: Metadata = { title: "Discover" };
export const dynamic = "force-dynamic";

export default async function DiscoverPage() {
  let previews: PostPreview[] = [];
  try {
    previews = await getRepo().listPreviews();
  } catch {
    // The filters still render from the fixed lists if the database is unreachable.
  }

  return (
    <div className="pt-16 md:pt-[72px]">
      <DiscoverPanel companies={discoverCompanies(previews)} />
      <ContributeCta />
    </div>
  );
}
