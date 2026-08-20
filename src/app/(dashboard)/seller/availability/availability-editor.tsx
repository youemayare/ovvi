"use client";

import { useState, useTransition } from "react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveAvailabilityRules, addBlackoutDate, removeBlackoutDate } from "@/actions/availability.actions";
import { Trash2, Plus, Check, AlertCircle, Loader2 } from "lucide-react";
import { format } from "date-fns";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

type Rule = { dayOfWeek: number; isAvailable: boolean; maxOrders: number | null };
type BlackoutDate = { id: string; date: string; reason: string | null };

interface AvailabilityEditorProps {
  initialRules: Rule[];
  initialBlackouts: BlackoutDate[];
}

export function AvailabilityEditor({ initialRules, initialBlackouts }: AvailabilityEditorProps) {
  // Build a map with defaults (all days available)
  const defaultRules: Rule[] = DAYS.map((_, i) => ({
    dayOfWeek: i,
    isAvailable: i !== 0, // default: closed Sundays
    maxOrders: null,
  }));

  const mergedRules = defaultRules.map((def) => {
    const saved = initialRules.find((r) => r.dayOfWeek === def.dayOfWeek);
    return saved ?? def;
  });

  const [rules, setRules] = useState<Rule[]>(mergedRules);
  const [blackouts, setBlackouts] = useState<BlackoutDate[]>(initialBlackouts);
  const [newDate, setNewDate] = useState("");
  const [newReason, setNewReason] = useState("");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function toggleDay(dayOfWeek: number) {
    setRules((prev) =>
      prev.map((r) =>
        r.dayOfWeek === dayOfWeek ? { ...r, isAvailable: !r.isAvailable } : r
      )
    );
    setSaved(false);
  }

  function setMaxOrders(dayOfWeek: number, value: string) {
    const parsed = value === "" ? null : parseInt(value, 10);
    setRules((prev) =>
      prev.map((r) =>
        r.dayOfWeek === dayOfWeek ? { ...r, maxOrders: parsed } : r
      )
    );
    setSaved(false);
  }

  function handleSaveSchedule() {
    setError(null);
    startTransition(async () => {
      try {
        await saveAvailabilityRules(rules);
        setSaved(true);
      } catch (err: any) {
        setError(err.message || "Failed to save");
      }
    });
  }

  function handleAddBlackout() {
    if (!newDate) return;
    startTransition(async () => {
      try {
        await addBlackoutDate(newDate, newReason || undefined);
        setBlackouts((prev) => [
          ...prev,
          { id: crypto.randomUUID(), date: newDate, reason: newReason || null },
        ]);
        setNewDate("");
        setNewReason("");
      } catch (err: any) {
        setError(err.message || "Failed to add date");
      }
    });
  }

  function handleRemoveBlackout(id: string) {
    startTransition(async () => {
      try {
        await removeBlackoutDate(id);
        setBlackouts((prev) => prev.filter((b) => b.id !== id));
      } catch (err: any) {
        setError(err.message || "Failed to remove date");
      }
    });
  }

  return (
    <div className="space-y-8">
      {error && (
        <div className="p-3 bg-red-50 text-red-600 rounded-lg flex items-center gap-2 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Weekly Schedule */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-100">
          <h2 className="font-semibold text-stone-900">Weekly Schedule</h2>
          <p className="text-sm text-stone-500 mt-0.5">Set your recurring open days and capacity limits.</p>
        </div>
        <div className="divide-y divide-stone-100">
          {rules.map((rule) => (
            <div key={rule.dayOfWeek} className="px-6 py-4 flex items-center gap-6">
              <div className="w-32 font-medium text-stone-700">{DAYS[rule.dayOfWeek]}</div>
              <Switch
                checked={rule.isAvailable}
                onCheckedChange={() => toggleDay(rule.dayOfWeek)}
              />
              <span className={`text-sm ${rule.isAvailable ? "text-green-600" : "text-stone-400"}`}>
                {rule.isAvailable ? "Open" : "Closed"}
              </span>
              {rule.isAvailable && (
                <div className="flex items-center gap-2 ml-auto">
                  <Label className="text-sm text-stone-500 whitespace-nowrap">Max orders</Label>
                  <Input
                    type="number"
                    min={1}
                    placeholder="Unlimited"
                    value={rule.maxOrders ?? ""}
                    onChange={(e) => setMaxOrders(rule.dayOfWeek, e.target.value)}
                    className="w-28 h-8 text-sm"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="px-6 py-4 bg-stone-50 border-t border-stone-100 flex items-center justify-between">
          {saved && (
            <span className="text-green-600 text-sm flex items-center gap-1">
              <Check className="w-4 h-4" /> Schedule saved!
            </span>
          )}
          <Button
            onClick={handleSaveSchedule}
            disabled={isPending}
            className="ml-auto bg-stone-900 text-white hover:bg-stone-800"
          >
            {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Save Schedule
          </Button>
        </div>
      </div>

      {/* Blackout Dates */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-100">
          <h2 className="font-semibold text-stone-900">Blackout Dates</h2>
          <p className="text-sm text-stone-500 mt-0.5">Block specific dates — holidays, vacations, or busy periods.</p>
        </div>

        <div className="divide-y divide-stone-100">
          {blackouts.length === 0 ? (
            <div className="px-6 py-8 text-center text-stone-400 text-sm">
              No blocked dates yet.
            </div>
          ) : (
            blackouts
              .sort((a, b) => a.date.localeCompare(b.date))
              .map((b) => (
                <div key={b.id} className="px-6 py-4 flex items-center justify-between">
                  <div>
                    <div className="font-medium text-stone-800">
                      {format(new Date(b.date + "T12:00:00"), "EEEE, MMMM d, yyyy")}
                    </div>
                    {b.reason && (
                      <div className="text-sm text-stone-500 mt-0.5">{b.reason}</div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveBlackout(b.id)}
                    disabled={isPending}
                    className="text-stone-400 hover:text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))
          )}
        </div>

        <div className="px-6 py-4 bg-stone-50 border-t border-stone-100">
          <div className="flex gap-3 flex-wrap">
            <Input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="w-44"
            />
            <Input
              placeholder="Reason (optional)"
              value={newReason}
              onChange={(e) => setNewReason(e.target.value)}
              className="flex-1 min-w-[180px]"
            />
            <Button
              onClick={handleAddBlackout}
              disabled={!newDate || isPending}
              variant="outline"
            >
              <Plus className="w-4 h-4 mr-2" />
              Block Date
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
