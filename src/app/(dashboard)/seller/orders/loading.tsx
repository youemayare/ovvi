export default function Loading() {
  return (
    <div className="animate-pulse space-y-5">
      <div className="flex items-center justify-between">
        <div className="h-7 w-32 bg-stone-200 rounded-xl" />
        <div className="h-5 w-16 bg-stone-100 rounded-full" />
      </div>
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-stone-50 flex gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-4 w-20 bg-stone-200 rounded" />)}
        </div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex gap-6 px-4 py-4 border-t border-stone-100">
            <div className="h-4 w-32 bg-stone-200 rounded" />
            <div className="h-4 w-20 bg-stone-100 rounded" />
            <div className="h-4 w-20 bg-stone-100 rounded ml-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}
