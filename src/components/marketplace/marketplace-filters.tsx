"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useTransition, useRef, useEffect } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";

interface MarketplaceFiltersProps {
  cities: string[];
}

export function MarketplaceFilters({ cities }: MarketplaceFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  const q = searchParams.get("q") ?? "";
  const city = searchParams.get("city") ?? "";
  const fulfillment = searchParams.get("fulfillment") ?? "";
  const cash = searchParams.get("cash") ?? "";

  const hasFilters = !!(q || city || fulfillment || cash);

  /** Build a new URL with one param changed, preserving others. */
  const pushParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
      });
    },
    [searchParams, pathname, router]
  );

  const clearAll = () => {
    startTransition(() => {
      router.push(pathname, { scroll: false });
    });
  };

  // Debounce the text search so we don't push on every keystroke
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleSearch = (val: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => pushParam("q", val), 350);
  };

  // Sync input value when URL resets (e.g., "Clear all")
  useEffect(() => {
    if (inputRef.current && q !== inputRef.current.value) {
      inputRef.current.value = q;
    }
  }, [q]);

  const FULFILLMENT_OPTIONS = [
    { label: "Any", value: "" },
    { label: "Pickup", value: "PICKUP" },
    { label: "Delivery", value: "DELIVERY" },
  ];

  return (
    <div
      className={`bg-white rounded-2xl border border-stone-200 shadow-sm p-4 sm:p-5 space-y-4 transition-opacity ${
        isPending ? "opacity-60 pointer-events-none" : ""
      }`}
    >
      {/* Row 1: Search + City + Clear */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Text search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
          <input
            ref={inputRef}
            type="search"
            defaultValue={q}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search bakers…"
            className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-stone-200 bg-stone-50
                       focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-400
                       placeholder:text-stone-400 transition"
            id="marketplace-search"
          />
        </div>

        {/* City dropdown */}
        {cities.length > 0 && (
          <select
            value={city}
            onChange={(e) => pushParam("city", e.target.value)}
            className="sm:w-44 py-2.5 pl-3 pr-8 text-sm rounded-xl border border-stone-200 bg-stone-50
                       focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-400
                       text-stone-700 transition appearance-none cursor-pointer"
            id="city-filter"
            aria-label="Filter by city"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2378716c' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 12px center",
            }}
          >
            <option value="">All cities</option>
            {cities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Row 2: Fulfillment pills + Cash toggle + Clear */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Fulfillment type pill group */}
        <div className="flex items-center gap-1 bg-stone-100 rounded-xl p-1">
          {FULFILLMENT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => pushParam("fulfillment", opt.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                fulfillment === opt.value
                  ? "bg-white text-primary-700 shadow-sm border border-stone-200"
                  : "text-stone-500 hover:text-stone-700"
              }`}
              id={`fulfillment-${opt.value || "any"}`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Cash toggle */}
        <button
          onClick={() => pushParam("cash", cash ? "" : "1")}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl border transition-all ${
            cash
              ? "bg-green-50 text-green-700 border-green-300"
              : "bg-stone-100 text-stone-500 border-stone-200 hover:text-stone-700"
          }`}
          id="cash-filter"
        >
          💵 Cash accepted
        </button>

        {/* Clear all */}
        {hasFilters && (
          <button
            onClick={clearAll}
            className="flex items-center gap-1 text-xs text-stone-400 hover:text-stone-700 transition-colors ml-auto"
            id="clear-filters"
          >
            <X className="w-3.5 h-3.5" />
            Clear filters
          </button>
        )}

        {/* Active filter indicator */}
        {isPending && (
          <span className="text-xs text-stone-400 animate-pulse ml-auto">Searching…</span>
        )}
      </div>
    </div>
  );
}
