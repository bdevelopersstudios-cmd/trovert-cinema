import { db } from "@/lib/db";
import { PageHeader } from "@/components/admin/ui";
import { PackagesManager } from "@/components/admin/PackagesManager";

export const dynamic = "force-dynamic";

export default async function AdminPackagesPage() {
  const packages = await db.listPackages();

  return (
    <>
      <PageHeader
        title="Packages"
        subtitle="Pricing and group sizes. Exclusive packages hand over the whole hall for that slot."
      />
      <PackagesManager packages={packages} />
    </>
  );
}
