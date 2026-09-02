"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, GhostButton, Labeled, PrimaryButton, inputClass } from "./ui";
import { slotDurationMins, to12Hour } from "@/lib/format";
import type { Slot, SlotPeriod } from "@/lib/types";

const BLANK = {
  start: "18:30",
  end: "21:00",
  period: "afternoon-evening" as SlotPeriod,
  label: "",
  active: true,
};

const PERIODS: { id: SlotPeriod; label: string }[] = [
  { id: "afternoon-evening", label: "Afternoon / Evening" },
  { id: "late-night-morning", label: "Late Night / Morning" },
];

export function SlotsManager({ slots }: { slots: Slot[] }) {
  const router = useRouter();
  const [draft, setDraft] = useState({ ...BLANK });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const autoLabel = `${to12Hour(draft.start)} - ${to12Hour(draft.end)}`;

  async function create(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/slots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...draft, label: draft.label.trim() || autoLabel }),
      });
      if (!response.ok) {
        setError(((await response.json()) as { error?: string }).error ?? "Could not save");
        return;
      }
      setDraft({ ...BLANK });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function patch(slot: Slot, body: Partial<Slot>) {
    await fetch(`/api/slots/${slot.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    router.refresh();
  }

  async function remove(slot: Slot) {
    if (!confirm(`Delete the ${slot.label} slot? Existing bookings keep their record.`)) return;
    await fetch(`/api/slots/${slot.id}`, { method: "DELETE" });
    router.refresh();
  }

  async function move(slot: Slot, direction: -1 | 1) {
    const ordered = [...slots].sort((a, b) => a.order - b.order);
    const index = ordered.findIndex((s) => s.id === slot.id);
    const swap = ordered[index + direction];
    if (!swap) return;
    await Promise.all([
      patch(slot, { order: swap.order }),
      patch(swap, { order: slot.order }),
    ]);
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[22rem_1fr]">
      <Card className="xl:sticky xl:top-8 xl:self-start">
        <h2 className="mb-5 font-display text-xl font-bold text-cream">Add a slot</h2>

        <form onSubmit={create} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Labeled label="Starts">
              <input
                type="time"
                required
                className={inputClass}
                value={draft.start}
                onChange={(e) => setDraft({ ...draft, start: e.target.value })}
              />
            </Labeled>
            <Labeled label="Ends">
              <input
                type="time"
                required
                className={inputClass}
                value={draft.end}
                onChange={(e) => setDraft({ ...draft, end: e.target.value })}
              />
            </Labeled>
          </div>

          <Labeled label="Group">
            <select
              className={inputClass}
              value={draft.period}
              onChange={(e) => setDraft({ ...draft, period: e.target.value as SlotPeriod })}
            >
              {PERIODS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </Labeled>

          <Labeled label="Label">
            <input
              className={inputClass}
              placeholder={autoLabel}
              value={draft.label}
              onChange={(e) => setDraft({ ...draft, label: e.target.value })}
            />
          </Labeled>

          <p className="text-xs text-muted">
            Duration: {Math.round(slotDurationMins(draft.start, draft.end) / 6) / 10} hrs
            {slotDurationMins(draft.start, draft.end) > 12 * 60 && " — crosses midnight, check the times"}
          </p>

          {error && <p className="text-sm text-red-bright">{error}</p>}

          <PrimaryButton type="submit" disabled={busy}>
            {busy ? "Saving…" : "Add slot"}
          </PrimaryButton>
        </form>
      </Card>

      <div className="space-y-6">
        {PERIODS.map((period) => {
          const rows = slots.filter((s) => s.period === period.id).sort((a, b) => a.order - b.order);
          return (
            <Card key={period.id}>
              <h3 className="mb-4 text-xs uppercase tracking-[0.25em] text-tan">{period.label}</h3>
              {rows.length === 0 ? (
                <p className="py-4 text-sm text-muted">No slots in this group.</p>
              ) : (
                <ul className="divide-y divide-line/60">
                  {rows.map((slot) => (
                    <li key={slot.id} className="flex flex-wrap items-center gap-3 py-3.5">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-cream">
                          {slot.label}
                          {!slot.active && (
                            <span className="ml-3 rounded-full bg-surface-2 px-2.5 py-0.5 text-[10px] uppercase tracking-wider text-muted">
                              Off
                            </span>
                          )}
                        </p>
                        <p className="mt-0.5 text-xs text-muted">
                          {Math.round(slotDurationMins(slot.start, slot.end) / 6) / 10} hrs
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1.5">
                        <GhostButton onClick={() => move(slot, -1)} aria-label="Move up">
                          ↑
                        </GhostButton>
                        <GhostButton onClick={() => move(slot, 1)} aria-label="Move down">
                          ↓
                        </GhostButton>
                        <GhostButton onClick={() => patch(slot, { active: !slot.active })}>
                          {slot.active ? "Disable" : "Enable"}
                        </GhostButton>
                        <GhostButton onClick={() => remove(slot)}>Delete</GhostButton>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
