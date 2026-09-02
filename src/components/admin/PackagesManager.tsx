"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, GhostButton, Labeled, PrimaryButton, inputClass } from "./ui";
import { formatPKR } from "@/lib/format";
import { TOTAL_SEATS } from "@/lib/seats";
import type { Package } from "@/lib/types";

export function PackagesManager({ packages }: { packages: Package[] }) {
  return (
    <div className="space-y-3">
      {packages.map((pkg) => (
        <PackageRow key={pkg.id} pkg={pkg} />
      ))}
    </div>
  );
}

function PackageRow({ pkg }: { pkg: Package }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(pkg);
  const [busy, setBusy] = useState(false);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      await fetch(`/api/packages/${pkg.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: draft.name,
          note: draft.note,
          price: Number(draft.price),
          minGuests: Number(draft.minGuests),
          maxGuests: Number(draft.maxGuests),
          exclusive: draft.exclusive,
          active: draft.active,
        }),
      });
      setOpen(false);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <div className="flex flex-wrap items-center gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-lg font-bold text-cream">
            {pkg.name}
            {!pkg.active && (
              <span className="ml-3 rounded-full bg-surface-2 px-2.5 py-1 text-[10px] uppercase tracking-wider text-muted">
                Hidden
              </span>
            )}
          </h3>
          <p className="mt-0.5 text-xs text-muted">
            {pkg.minGuests === pkg.maxGuests
              ? `${pkg.minGuests} guests`
              : `${pkg.minGuests}–${pkg.maxGuests} guests`}{" "}
            · {pkg.exclusive ? "entire cinema" : "shared, priced per person"}
          </p>
        </div>
        <p className="font-display text-xl font-bold text-cream">{formatPKR(pkg.price)}</p>
        <GhostButton onClick={() => setOpen((v) => !v)}>{open ? "Close" : "Edit"}</GhostButton>
      </div>

      {open && (
        <form onSubmit={save} className="mt-6 grid gap-3 border-t border-line/60 pt-6 sm:grid-cols-2">
          <Labeled label="Name">
            <input
              className={inputClass}
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            />
          </Labeled>
          <Labeled label="Price (PKR)">
            <input
              type="number"
              className={inputClass}
              value={draft.price}
              onChange={(e) => setDraft({ ...draft, price: Number(e.target.value) })}
            />
          </Labeled>
          <Labeled label="Min guests">
            <input
              type="number"
              min={1}
              max={TOTAL_SEATS}
              className={inputClass}
              value={draft.minGuests}
              onChange={(e) => setDraft({ ...draft, minGuests: Number(e.target.value) })}
            />
          </Labeled>
          <Labeled label="Max guests">
            <input
              type="number"
              min={1}
              max={TOTAL_SEATS}
              className={inputClass}
              value={draft.maxGuests}
              onChange={(e) => setDraft({ ...draft, maxGuests: Number(e.target.value) })}
            />
          </Labeled>
          <div className="sm:col-span-2">
            <Labeled label="Note shown to guests">
              <input
                className={inputClass}
                value={draft.note}
                onChange={(e) => setDraft({ ...draft, note: e.target.value })}
              />
            </Labeled>
          </div>

          <label className="flex items-center gap-2.5 text-sm text-muted">
            <input
              type="checkbox"
              checked={draft.exclusive}
              onChange={(e) => setDraft({ ...draft, exclusive: e.target.checked })}
              className="accent-[var(--color-red-bright)]"
            />
            Books the entire cinema
          </label>
          <label className="flex items-center gap-2.5 text-sm text-muted">
            <input
              type="checkbox"
              checked={draft.active}
              onChange={(e) => setDraft({ ...draft, active: e.target.checked })}
              className="accent-[var(--color-red-bright)]"
            />
            Offer on the site
          </label>

          <div className="sm:col-span-2">
            <PrimaryButton type="submit" disabled={busy}>
              {busy ? "Saving…" : "Save package"}
            </PrimaryButton>
          </div>
        </form>
      )}
    </Card>
  );
}
