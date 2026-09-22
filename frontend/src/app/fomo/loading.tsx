import { Skeleton, StoryCardSkeleton } from "@/components/Skeleton";

export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-[1680px] flex-1 px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-2xl overflow-hidden rounded-2xl border border-stone-200 bg-white p-8 dark:border-stone-800 dark:bg-stone-900">
        <div className="flex flex-col items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-3 w-40" />
          <Skeleton className="mt-4 h-12 w-24" />
        </div>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <StoryCardSkeleton key={i} />
        ))}
      </div>
    </main>
  );
}
