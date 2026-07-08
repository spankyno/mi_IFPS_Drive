export default function SharedLoading() {
  return (
    <div className="space-y-6 p-4 lg:p-8">
      <div className="space-y-2">
        <div className="h-7 w-40 animate-pulse rounded-md bg-muted" />
        <div className="h-4 w-64 animate-pulse rounded-md bg-muted" />
      </div>
      <div className="h-40 animate-pulse rounded-lg border bg-muted/50" />
      <div className="h-40 animate-pulse rounded-lg border bg-muted/50" />
    </div>
  );
}
