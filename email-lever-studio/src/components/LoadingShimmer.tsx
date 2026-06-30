export function GroupCardSkeleton() {
  return (
    <div className="rounded-xl border border-[#e5e3de] bg-white p-5">
      <div className="mb-3 h-4 w-28 animate-pulse rounded bg-[#e5e3de]" />
      <div className="mb-4 h-3 w-3/4 animate-pulse rounded bg-[#e5e3de]/70" />
      <div className="space-y-3">
        <div className="h-8 w-full animate-pulse rounded-lg bg-[#e5e3de]/50" />
        <div className="h-8 w-4/5 animate-pulse rounded-lg bg-[#e5e3de]/50" />
      </div>
    </div>
  )
}

export function DraftSkeleton() {
  return (
    <div className="mt-4 space-y-3">
      <div className="h-6 w-4/5 animate-pulse rounded bg-[#e5e3de]" />
      <div className="h-4 w-2/3 animate-pulse rounded bg-[#e5e3de]/70" />
      <div className="my-4 border-t border-[#e5e3de]" />
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="h-4 animate-pulse rounded bg-[#e5e3de]/50"
          style={{ width: `${90 - i * 8}%` }}
        />
      ))}
    </div>
  )
}

export function ThinkingMessage({ message }: { message: string }) {
  return (
    <p className="mb-3 text-[13px] italic text-[#6b6960] animate-pulse">
      {message}
    </p>
  )
}
