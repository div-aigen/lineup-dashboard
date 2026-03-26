export function ChartSkeleton({ title }) {
  return (
    <div className="glass-panel rounded-md p-6 animate-pulse">
      <div className="h-5 w-32 bg-slate-700/50 rounded mb-4" />
      <div className="h-[260px] flex items-end gap-2 px-4">
        {[40, 65, 45, 80, 55, 70, 50, 60, 75, 45, 85, 55].map((h, i) => (
          <div
            key={i}
            className="flex-1 bg-slate-700/30 rounded-t"
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
    </div>
  );
}

export function KPISkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3 sm:gap-4">
      {Array.from({ length: 7 }).map((_, i) => (
        <div key={i} className="glass-panel rounded-md p-4 animate-pulse">
          <div className="h-5 w-5 bg-slate-700/50 rounded mb-3" />
          <div className="h-7 w-16 bg-slate-700/50 rounded mb-2" />
          <div className="h-3 w-20 bg-slate-700/30 rounded" />
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton() {
  return (
    <div className="glass-panel rounded-md p-6 animate-pulse">
      <div className="h-5 w-40 bg-slate-700/50 rounded mb-4" />
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-4">
            <div className="h-4 flex-[2] bg-slate-700/30 rounded" />
            <div className="h-4 flex-1 bg-slate-700/30 rounded" />
            <div className="h-4 flex-1 bg-slate-700/30 rounded" />
            <div className="h-4 flex-[0.5] bg-slate-700/30 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SmallChartSkeleton() {
  return (
    <div className="glass-panel rounded-md p-6 animate-pulse">
      <div className="h-5 w-28 bg-slate-700/50 rounded mb-4" />
      <div className="h-[200px] flex items-center justify-center">
        <div className="w-32 h-32 rounded-full border-[16px] border-slate-700/30" />
      </div>
    </div>
  );
}
