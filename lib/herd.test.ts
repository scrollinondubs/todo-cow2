import { describe, expect, it } from "vitest";
import type { Cow, Task } from "@/lib/db/schema";
import {
  isPastDue,
  sortCowsByPriority,
  sortTasksForDisplay,
  summarizeCowTasks,
  type CowWithTasks,
} from "@/lib/herd";

function makeCow(overrides: Pick<Cow, "id" | "name" | "earTagNumber">): Cow {
  return {
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function makeTask(
  overrides: Pick<Task, "id" | "cowId" | "title" | "dueDate"> & Partial<Task>
): Task {
  return {
    isDone: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe("isPastDue", () => {
  it("treats dates before today as past due", () => {
    expect(isPastDue("2020-01-01", "2026-01-01")).toBe(true);
  });

  it("treats today and future dates as not past due", () => {
    expect(isPastDue("2026-01-01", "2026-01-01")).toBe(false);
    expect(isPastDue("2027-01-01", "2026-01-01")).toBe(false);
  });
});

describe("summarizeCowTasks", () => {
  it("counts only outstanding tasks, and overdue among those", () => {
    const cow: CowWithTasks = {
      ...makeCow({ id: "cow-1", name: "Bessie", earTagNumber: "1" }),
      tasks: [
        makeTask({ id: "t1", cowId: "cow-1", title: "Milk", dueDate: "2020-01-01" }),
        makeTask({ id: "t2", cowId: "cow-1", title: "Vaccinate", dueDate: "2099-01-01" }),
        makeTask({ id: "t3", cowId: "cow-1", title: "Hoof check", dueDate: "2020-01-01", isDone: true }),
      ],
    };

    const summary = summarizeCowTasks(cow, "2026-01-01");
    expect(summary.outstandingCount).toBe(2);
    expect(summary.overdueCount).toBe(1);
  });
});

describe("sortCowsByPriority", () => {
  it("puts cows with overdue tasks ahead of cows without any", () => {
    const overdueCow: CowWithTasks = {
      ...makeCow({ id: "cow-overdue", name: "Overdue", earTagNumber: "1" }),
      tasks: [makeTask({ id: "t1", cowId: "cow-overdue", title: "Milk", dueDate: "2020-01-01" })],
    };
    const upToDateCow: CowWithTasks = {
      ...makeCow({ id: "cow-fine", name: "Fine", earTagNumber: "2" }),
      tasks: [makeTask({ id: "t2", cowId: "cow-fine", title: "Milk", dueDate: "2099-01-01" })],
    };

    const sorted = sortCowsByPriority([upToDateCow, overdueCow]);
    expect(sorted[0].id).toBe("cow-overdue");
  });
});

describe("sortTasksForDisplay", () => {
  it("moves completed tasks to the end and sorts the rest by due date", () => {
    const tasks: Task[] = [
      makeTask({ id: "t1", cowId: "cow-1", title: "Later", dueDate: "2026-02-01" }),
      makeTask({ id: "t2", cowId: "cow-1", title: "Done", dueDate: "2020-01-01", isDone: true }),
      makeTask({ id: "t3", cowId: "cow-1", title: "Sooner", dueDate: "2026-01-01" }),
    ];

    const sorted = sortTasksForDisplay(tasks);
    expect(sorted.map((task) => task.id)).toEqual(["t3", "t1", "t2"]);
  });
});
