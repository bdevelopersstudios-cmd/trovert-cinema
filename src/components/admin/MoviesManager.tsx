"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, GhostButton, Labeled, PrimaryButton, inputClass } from "./ui";
import type { Movie } from "@/lib/types";

const BLANK = {
  title: "",
  year: new Date().getFullYear(),
  genre: "",
  language: "",
  durationMins: 120,
  rating: "",
  synopsis: "",
  posterUrl: "",
  accent: "#b3221f",
  active: true,
};

export function MoviesManager({ movies }: { movies: Movie[] }) {
  const router = useRouter();
  const [draft, setDraft] = useState({ ...BLANK });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function reset() {
    setDraft({ ...BLANK });
    setEditingId(null);
    setError("");
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch(editingId ? `/api/movies/${editingId}` : "/api/movies", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      if (!response.ok) {
        setError(((await response.json()) as { error?: string }).error ?? "Could not save");
        return;
      }
      reset();
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function toggleActive(movie: Movie) {
    await fetch(`/api/movies/${movie.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !movie.active }),
    });
    router.refresh();
  }

  async function remove(movie: Movie) {
    if (!confirm(`Remove "${movie.title}" from the listing?`)) return;
    await fetch(`/api/movies/${movie.id}`, { method: "DELETE" });
    if (editingId === movie.id) reset();
    router.refresh();
  }

  function edit(movie: Movie) {
    setEditingId(movie.id);
    setError("");
    setDraft({
      title: movie.title,
      year: movie.year ?? new Date().getFullYear(),
      genre: movie.genre,
      language: movie.language,
      durationMins: movie.durationMins,
      rating: movie.rating,
      synopsis: movie.synopsis,
      posterUrl: movie.posterUrl,
      accent: movie.accent,
      active: movie.active,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[24rem_1fr]">
      <Card className="xl:sticky xl:top-8 xl:self-start">
        <h2 className="mb-5 font-display text-xl font-bold text-cream">
          {editingId ? "Edit movie" : "Add a movie"}
        </h2>

        <form onSubmit={save} className="space-y-3">
          <Labeled label="Title">
            <input
              required
              className={inputClass}
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            />
          </Labeled>

          <div className="grid grid-cols-2 gap-3">
            <Labeled label="Year">
              <input
                type="number"
                className={inputClass}
                value={draft.year}
                onChange={(e) => setDraft({ ...draft, year: Number(e.target.value) })}
              />
            </Labeled>
            <Labeled label="Runtime (min)">
              <input
                type="number"
                className={inputClass}
                value={draft.durationMins}
                onChange={(e) => setDraft({ ...draft, durationMins: Number(e.target.value) })}
              />
            </Labeled>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Labeled label="Genre">
              <input
                className={inputClass}
                placeholder="Action / Drama"
                value={draft.genre}
                onChange={(e) => setDraft({ ...draft, genre: e.target.value })}
              />
            </Labeled>
            <Labeled label="Language">
              <input
                className={inputClass}
                placeholder="Urdu"
                value={draft.language}
                onChange={(e) => setDraft({ ...draft, language: e.target.value })}
              />
            </Labeled>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Labeled label="Rating">
              <input
                className={inputClass}
                placeholder="PG-13"
                value={draft.rating}
                onChange={(e) => setDraft({ ...draft, rating: e.target.value })}
              />
            </Labeled>
            <Labeled label="Screen glow">
              <input
                type="color"
                className="h-[42px] w-full rounded-xl border border-line bg-surface-2 px-1"
                value={draft.accent}
                onChange={(e) => setDraft({ ...draft, accent: e.target.value })}
              />
            </Labeled>
          </div>

          <Labeled label="Synopsis">
            <textarea
              rows={3}
              className={`${inputClass} resize-none`}
              value={draft.synopsis}
              onChange={(e) => setDraft({ ...draft, synopsis: e.target.value })}
            />
          </Labeled>

          <label className="flex items-center gap-2.5 pt-1 text-sm text-muted">
            <input
              type="checkbox"
              checked={draft.active}
              onChange={(e) => setDraft({ ...draft, active: e.target.checked })}
              className="accent-[var(--color-red-bright)]"
            />
            Show on the public site
          </label>

          {error && <p className="text-sm text-red-bright">{error}</p>}

          <div className="flex items-center gap-3 pt-2">
            <PrimaryButton type="submit" disabled={busy}>
              {busy ? "Saving…" : editingId ? "Save changes" : "Add movie"}
            </PrimaryButton>
            {editingId && (
              <GhostButton type="button" onClick={reset}>
                Cancel
              </GhostButton>
            )}
          </div>
        </form>
      </Card>

      <div className="space-y-3">
        {movies.map((movie) => (
          <Card key={movie.id} className="flex flex-wrap items-start gap-4">
            <span
              className="mt-1.5 h-10 w-1.5 shrink-0 rounded-full"
              style={{ background: movie.accent }}
            />
            <div className="min-w-0 flex-1">
              <h3 className="font-display text-lg font-bold text-cream">
                {movie.title}
                {!movie.active && (
                  <span className="ml-3 rounded-full bg-surface-2 px-2.5 py-1 text-[10px] uppercase tracking-wider text-muted">
                    Hidden
                  </span>
                )}
              </h3>
              <p className="mt-0.5 text-xs text-muted">
                {[movie.year, movie.genre, movie.language, `${movie.durationMins} min`, movie.rating]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              {movie.synopsis && (
                <p className="mt-2 line-clamp-2 text-sm text-muted">{movie.synopsis}</p>
              )}
            </div>
            <div className="flex shrink-0 gap-2">
              <GhostButton onClick={() => edit(movie)}>Edit</GhostButton>
              <GhostButton onClick={() => toggleActive(movie)}>
                {movie.active ? "Hide" : "Show"}
              </GhostButton>
              <GhostButton onClick={() => remove(movie)}>Delete</GhostButton>
            </div>
          </Card>
        ))}
        {movies.length === 0 && (
          <Card>
            <p className="py-8 text-center text-sm text-muted">
              No movies yet — add the first one on the left.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
