import { ContributeCta } from "@/components/home/ContributeCta";
import { DiscoverPanel, discoverCompanies } from "@/components/home/DiscoverPanel";
import { FeaturedExperiences } from "@/components/home/FeaturedExperiences";
import { Hero } from "@/components/home/Hero";
import { HowItWorks } from "@/components/home/HowItWorks";
import { KineticBand } from "@/components/home/KineticBand";
import { MostHelpful } from "@/components/home/MostHelpful";
import { getRepo } from "@/lib/data";
import type { PostPreview } from "@/types";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let previews: PostPreview[] = [];
  try {
    previews = await getRepo().listPreviews();
  } catch {
    // The homepage still renders its static sections if the database is unreachable.
  }

  const featured = previews.slice(0, 4);
  // "Most helpful" is ranked by how much discussion an experience started.
  const helpful = [...previews]
    .sort((a, b) => b.comment_count - a.comment_count || b.created_at.localeCompare(a.created_at))
    .slice(0, 8);

  const stats = {
    experiences: previews.length,
    companies: new Set(previews.map((post) => post.company_or_exam.toLowerCase())).size,
  };

  return (
    <>
      <Hero stats={stats} />
      <HowItWorks />
      <FeaturedExperiences posts={featured} />
      <KineticBand />
      <DiscoverPanel companies={discoverCompanies(previews)} />
      <MostHelpful posts={helpful} />
      <ContributeCta />
    </>
  );
}
