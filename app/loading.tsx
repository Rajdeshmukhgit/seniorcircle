import { LoadingState } from "@/components/ui/LoadingState";

export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-[820px] px-4 pb-16 pt-28 sm:px-6">
      <LoadingState rows={4} />
    </div>
  );
}
