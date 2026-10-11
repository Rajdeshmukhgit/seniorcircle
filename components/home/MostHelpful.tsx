import { RankedCard } from "@/components/experiences/RankedCard";
import type { PostPreview } from "@/types";
import { ScrollRow } from "./ScrollRow";
import { SectionHeading } from "./SectionHeading";

export function MostHelpful({ posts }: { posts: PostPreview[] }) {
  if (posts.length === 0) return null;
  return (
    <section id="most-helpful">
      <div className="container-site py-16 sm:py-24">
        <SectionHeading
          eyebrow="03 · Most helpful"
          title="Most Helpful Experiences"
          subtitle="The experiences juniors asked the most questions about, ranked by discussion."
          link={{ href: "/feed?sort=helpful", label: "View all" }}
        />
        <div className="mt-10">
          <ScrollRow label="Most helpful experiences">
            {posts.map((post, index) => (
              <div role="listitem" key={post.id} className="flex">
                <RankedCard post={post} rank={index + 1} />
              </div>
            ))}
          </ScrollRow>
        </div>
      </div>
    </section>
  );
}
