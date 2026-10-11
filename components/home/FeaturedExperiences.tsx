import { ExperienceCard } from "@/components/experiences/ExperienceCard";
import type { PostPreview } from "@/types";
import { SectionHeading } from "./SectionHeading";

export function FeaturedExperiences({ posts }: { posts: PostPreview[] }) {
  if (posts.length === 0) return null;
  return (
    <section id="featured">
      <div className="container-site py-16 sm:py-24">
        <SectionHeading
          eyebrow="01 · Featured"
          title="Featured Experiences"
          subtitle="Learn from seniors and alumni who have already been through the process."
          link={{ href: "/feed", label: "View all experiences" }}
        />
        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {posts.map((post) => (
            <ExperienceCard key={post.id} post={post} />
          ))}
        </div>
      </div>
    </section>
  );
}
