import type { Cow, Task } from "@/lib/db/schema";

export type CowWithTasks = Cow & { tasks: Task[] };

export function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function isPastDue(dueDate: string, today: string = todayIsoDate()): boolean {
  return dueDate < today;
}

export function formatDueDate(dueDate: string): string {
  const [year, month, day] = dueDate.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function summarizeCowTasks(cow: CowWithTasks, today: string = todayIsoDate()) {
  let outstandingCount = 0;
  let overdueCount = 0;

  for (const task of cow.tasks) {
    if (task.isDone) continue;
    outstandingCount += 1;
    if (isPastDue(task.dueDate, today)) overdueCount += 1;
  }

  return { outstandingCount, overdueCount };
}

// Prioritizes cows with the most overdue tasks, then the most outstanding
// tasks, so a herdsman working one screen sees the neediest cows first.
export function sortCowsByPriority(cows: CowWithTasks[]): CowWithTasks[] {
  const today = todayIsoDate();

  return [...cows].sort((a, b) => {
    const summaryA = summarizeCowTasks(a, today);
    const summaryB = summarizeCowTasks(b, today);

    if (summaryA.overdueCount !== summaryB.overdueCount) {
      return summaryB.overdueCount - summaryA.overdueCount;
    }
    if (summaryA.outstandingCount !== summaryB.outstandingCount) {
      return summaryB.outstandingCount - summaryA.outstandingCount;
    }
    return a.name.localeCompare(b.name);
  });
}

export function sortTasksForDisplay(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    if (a.isDone !== b.isDone) return a.isDone ? 1 : -1;
    return a.dueDate.localeCompare(b.dueDate);
  });
}
