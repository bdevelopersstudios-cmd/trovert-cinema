import { db } from "@/lib/db";
import { PageHeader, Card } from "@/components/admin/ui";
import { SettingsForm } from "@/components/admin/SettingsForm";
import { ROWS, SEATS, TOTAL_SEATS } from "@/lib/seats";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const settings = await db.getSettings();

  return (
    <>
      <PageHeader title="Settings" subtitle="Contact details and the copy shown across the site." />

      <div className="space-y-6">
        <SettingsForm settings={settings} />

        <Card className="max-w-2xl">
          <h2 className="font-display text-lg font-bold text-cream">The hall</h2>
          <p className="mt-1.5 text-sm text-muted">
            {TOTAL_SEATS} recliners across {ROWS.length} rows. The layout lives in{" "}
            <code className="rounded bg-surface-2 px-1.5 py-0.5 text-xs text-tan">
              src/lib/seats.ts
            </code>{" "}
            and drives both the 3D hall and the seat map.
          </p>
          <ul className="mt-4 space-y-1.5 text-sm text-muted">
            {ROWS.map((row) => (
              <li key={row}>
                Row {row} — {SEATS.filter((s) => s.row === row).length} seats (
                {SEATS.filter((s) => s.row === row)
                  .map((s) => s.label)
                  .join(", ")}
                )
              </li>
            ))}
          </ul>
        </Card>

        <Card className="max-w-2xl">
          <h2 className="font-display text-lg font-bold text-cream">Admin access</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-muted">
            The dashboard is behind a shared passcode set with the{" "}
            <code className="rounded bg-surface-2 px-1.5 py-0.5 text-xs text-tan">
              ADMIN_PASSCODE
            </code>{" "}
            environment variable. Change it in{" "}
            <code className="rounded bg-surface-2 px-1.5 py-0.5 text-xs text-tan">.env.local</code>{" "}
            and restart the app.
          </p>
        </Card>
      </div>
    </>
  );
}
