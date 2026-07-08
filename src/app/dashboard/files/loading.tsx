export default function FilesLoading() {
  return (
    <div className="space-y-4 p-4 lg:p-8">
      <div className="h-4 w-40 animate-pulse rounded-md bg-muted" />
      <div className="flex gap-2">
        <div className="h-10 flex-1 animate-pulse rounded-md bg-muted" />
        <div className="h-10 w-24 animate-pulse rounded-md bg-muted" />
        <div className="h-10 w-32 animate-pulse rounded-md bg-muted" />
        <div className="h-10 w-32 animate-pulse rounded-md bg-muted" />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-lg border bg-muted/50" />
        ))}
      </div>
    </div>
  );
}
