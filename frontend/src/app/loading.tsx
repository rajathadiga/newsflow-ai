import { Skeleton, StoryCardSkeleton } from "@/components/Skeleton";

export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-[1680px] flex-1 px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-8">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="mt-2 h-8 w-48" />
        <Skeleton className="mt-2 h-4 w-64" />
        <div className="mt-4 flex gap-2">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      </div>

      <Skeleton className="mb-3 h-5 w-24" />
      <div className="grid gap-3 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <StoryCardSkeleton key={i} />
        ))}
      </div>
    </main>
  );
}
