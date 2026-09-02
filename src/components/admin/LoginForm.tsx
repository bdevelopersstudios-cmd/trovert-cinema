"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function LoginForm() {
  const router = useRouter();
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/admin/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode }),
      });
      if (!response.ok) {
        setError("That passcode did not work.");
        return;
      }
      router.replace("/admin");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-7 space-y-3">
      <input
        type="password"
        autoFocus
        required
        value={passcode}
        onChange={(e) => setPasscode(e.target.value)}
        placeholder="Passcode"
        className="w-full rounded-xl border border-line bg-surface-2 px-4 py-3 text-center text-base tracking-[0.3em] text-cream sm:text-sm outline-none focus:border-tan"
      />
      {error && <p className="text-center text-sm text-red-bright">{error}</p>}
      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-full bg-red px-6 py-3 text-sm font-medium text-cream transition-colors hover:bg-red-bright disabled:opacity-50"
      >
        {busy ? "Checking…" : "Enter"}
      </button>
    </form>
  );
}
