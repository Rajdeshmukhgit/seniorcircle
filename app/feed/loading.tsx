import { LoadingState, Skeleton } from "@/components/ui/LoadingState";

export default function FeedLoading() {
  return (
    <div className="mx-auto w-full max-w-[820px] px-4 pb-16 pt-24 sm:px-6 md:pt-28">
      <Skeleton className="h-9 w-48" />
      <Skeleton className="mt-6 h-12 w-full rounded-xl" />
      <div className="mt-6">
        <LoadingState rows={5} label="Loading experiences" />
      </div>
    </div>
  );
}
