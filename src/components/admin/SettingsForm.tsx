"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Labeled, PrimaryButton, inputClass } from "./ui";
import type { Settings } from "@/lib/types";

export function SettingsForm({ settings }: { settings: Settings }) {
  const router = useRouter();
  const [draft, setDraft] = useState(settings);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setSaved(false);
    try {
      await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      setSaved(true);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="max-w-2xl">
      <form onSubmit={save} className="space-y-4">
        <Labeled label="Tagline">
          <input
            className={inputClass}
            value={draft.venueNote}
            onChange={(e) => setDraft({ ...draft, venueNote: e.target.value })}
          />
        </Labeled>

        <Labeled label="Location note">
          <textarea
            rows={3}
            className={`${inputClass} resize-none`}
            value={draft.locationNote}
            onChange={(e) => setDraft({ ...draft, locationNote: e.target.value })}
          />
        </Labeled>

        <div className="grid gap-4 sm:grid-cols-2">
          <Labeled label="WhatsApp number">
            <input
              className={inputClass}
              placeholder="+92 300 0000000"
              value={draft.whatsapp}
              onChange={(e) => setDraft({ ...draft, whatsapp: e.target.value })}
            />
          </Labeled>
          <Labeled label="Instagram handle">
            <input
              className={inputClass}
              placeholder="trovertspace"
              value={draft.instagram}
              onChange={(e) => setDraft({ ...draft, instagram: e.target.value })}
            />
          </Labeled>
        </div>

        <div className="flex items-center gap-4 pt-2">
          <PrimaryButton type="submit" disabled={busy}>
            {busy ? "Saving…" : "Save settings"}
          </PrimaryButton>
          {saved && <span className="text-sm text-tan">Saved.</span>}
        </div>
      </form>
    </Card>
  );
}
