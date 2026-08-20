export default function Loading() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-8 animate-pulse">
      {/* Store header */}
      <div className="h-48 bg-stone-200 rounded-2xl w-full" />
      <div className="bg-white rounded-2xl border border-stone-200 p-6">
        <div className="flex gap-6 items-center">
          <div className="w-24 h-24 rounded-full bg-stone-200 shrink-0" />
          <div className="space-y-3 flex-1">
            <div className="h-7 w-48 bg-stone-200 rounded-xl" />
            <div className="h-4 w-24 bg-stone-100 rounded" />
            <div className="h-4 w-64 bg-stone-100 rounded" />
          </div>
        </div>
      </div>
      {/* Products */}
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden divide-y divide-stone-100">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex justify-between items-center p-5 gap-4">
            <div className="space-y-2 flex-1">
              <div className="h-5 w-36 bg-stone-200 rounded" />
              <div className="h-3 w-48 bg-stone-100 rounded" />
            </div>
            <div className="h-24 w-24 bg-stone-200 rounded-xl shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}
