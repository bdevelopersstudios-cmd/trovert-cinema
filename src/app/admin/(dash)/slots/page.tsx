import { db } from "@/lib/db";
import { PageHeader } from "@/components/admin/ui";
import { SlotsManager } from "@/components/admin/SlotsManager";

export const dynamic = "force-dynamic";

export default async function AdminSlotsPage() {
  const slots = await db.listSlots();

  return (
    <>
      <PageHeader
        title="Time slots"
        subtitle="These are the windows guests can book. Disable one to take it off the site without losing it."
      />
      <SlotsManager slots={slots} />
    </>
  );
}
