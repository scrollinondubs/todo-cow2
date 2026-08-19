import { db } from "@/lib/db";
import { HerdView } from "@/components/herd-view";

// Task state changes via Server Actions on every add/toggle; force-dynamic
// keeps this the source of truth instead of serving a stale cached render.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const cows = await db.query.cows.findMany({
    with: { tasks: true },
  });

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-4 py-6">
      <header>
        <h1 className="text-2xl font-bold text-emerald-700">Todo Cow</h1>
        <p className="text-sm text-slate-500">Every cow, every task, one screen.</p>
      </header>
      <HerdView cows={cows} />
    </main>
  );
}
