"use client";

import { useTransition } from "react";
import { toggleTask } from "@/app/actions/tasks";
import type { Task } from "@/lib/db/schema";
import { formatDueDate, isPastDue } from "@/lib/herd";
import { cn } from "@/lib/utils";

export function TaskItem({ task }: { task: Task }) {
  const [isPending, startTransition] = useTransition();
  const overdue = !task.isDone && isPastDue(task.dueDate);

  return (
    <li
      className={cn(
        "flex items-center gap-3 rounded-md border p-3",
        overdue ? "border-red-300 bg-red-50" : "border-slate-200"
      )}
    >
      <label className="flex flex-1 items-center gap-3">
        <input
          type="checkbox"
          checked={task.isDone}
          disabled={isPending}
          onChange={(event) => {
            const nextDone = event.target.checked;
            startTransition(async () => {
              await toggleTask(task.id, nextDone);
            });
          }}
          className="h-6 w-6 shrink-0 accent-emerald-600"
          aria-label={`Mark ${task.title} as ${task.isDone ? "not done" : "done"}`}
        />
        <span className="flex-1">
          <span className={cn("block text-base font-medium", task.isDone && "text-slate-400 line-through")}>
            {task.title}
          </span>
          <span className={cn("block text-sm text-slate-500", overdue && "font-semibold text-red-600")}>
            Due {formatDueDate(task.dueDate)}
            {overdue ? " \u00b7 overdue" : ""}
          </span>
        </span>
      </label>
    </li>
  );
}
