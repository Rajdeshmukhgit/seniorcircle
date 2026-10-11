import { redirect } from "next/navigation";

/** /experiences has no page of its own; the list lives at /feed. */
export default function ExperiencesIndex() {
  redirect("/feed");
}
