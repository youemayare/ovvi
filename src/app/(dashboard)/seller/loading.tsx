export default function Loading() {
  return (
    <div className="space-y-8 max-w-5xl animate-pulse">
      {/* Header */}
      <div>
        <div className="h-7 w-48 bg-stone-200 rounded-xl mb-2" />
        <div className="h-4 w-64 bg-stone-100 rounded-lg" />
      </div>
      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-5">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-stone-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-stone-100" />
              <div className="h-4 w-20 bg-stone-100 rounded-lg" />
            </div>
            <div className="h-8 w-16 bg-stone-200 rounded-xl" />
          </div>
        ))}
      </div>
      {/* Orders placeholder */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6">
        <div className="h-5 w-32 bg-stone-200 rounded-lg mb-6" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center justify-between py-4 border-b border-stone-100 last:border-0">
            <div>
              <div className="h-4 w-28 bg-stone-200 rounded mb-1.5" />
              <div className="h-3 w-40 bg-stone-100 rounded" />
            </div>
            <div className="h-4 w-16 bg-stone-200 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
