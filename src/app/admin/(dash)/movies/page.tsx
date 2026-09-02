import { db } from "@/lib/db";
import { PageHeader } from "@/components/admin/ui";
import { MoviesManager } from "@/components/admin/MoviesManager";

export const dynamic = "force-dynamic";

export default async function AdminMoviesPage() {
  const movies = await db.listMovies();

  return (
    <>
      <PageHeader
        title="Movies"
        subtitle="Everything listed here shows up on the site and in the booking dropdown."
      />
      <MoviesManager movies={movies} />
    </>
  );
}
