export default function DashboardLoading() {
  return (
    <div className="space-y-6 p-4 lg:p-8">
      <div className="space-y-2">
        <div className="h-7 w-64 animate-pulse rounded-md bg-muted" />
        <div className="h-4 w-48 animate-pulse rounded-md bg-muted" />
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-lg border bg-muted/50" />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="h-48 animate-pulse rounded-lg border bg-muted/50" />
          <div className="h-32 animate-pulse rounded-lg border bg-muted/50" />
        </div>
        <div className="h-96 animate-pulse rounded-lg border bg-muted/50" />
      </div>
    </div>
  );
}
