"use client";

import { useMemo, useState } from "react";
import { AddCowForm } from "@/components/add-cow-form";
import { CowCard } from "@/components/cow-card";
import { sortCowsByPriority, type CowWithTasks } from "@/lib/herd";

export function HerdView({ cows }: { cows: CowWithTasks[] }) {
  const [showAddCow, setShowAddCow] = useState(cows.length === 0);
  const sortedCows = useMemo(() => sortCowsByPriority(cows), [cows]);

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Cows</h2>
          <button
            type="button"
            onClick={() => setShowAddCow((open) => !open)}
            className="text-sm font-medium text-emerald-700 underline-offset-2 hover:underline"
          >
            {showAddCow ? "Close" : "Add cow"}
          </button>
        </div>
        {showAddCow && (
          <div className="mt-4">
            <AddCowForm onAdded={() => setShowAddCow(false)} />
          </div>
        )}
      </section>

      {sortedCows.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
          No cows yet. Add your first cow above.
        </p>
      ) : (
        <ul className="flex flex-col gap-4">
          {sortedCows.map((cow) => (
            <li key={cow.id}>
              <CowCard cow={cow} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
