"use client";

import { useRef, useState, useTransition } from "react";
import { deleteCow, updateCow } from "@/app/actions/cows";
import { AddTaskForm } from "@/components/add-task-form";
import { TaskItem } from "@/components/task-item";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { sortTasksForDisplay, summarizeCowTasks, type CowWithTasks } from "@/lib/herd";
import { cn } from "@/lib/utils";

export function CowCard({ cow }: { cow: CowWithTasks }) {
  const [isEditing, setIsEditing] = useState(false);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [isSaving, startSaving] = useTransition();
  const [isDeleting, startDeleting] = useTransition();
  const editFormRef = useRef<HTMLFormElement>(null);

  const { overdueCount, outstandingCount } = summarizeCowTasks(cow);
  const sortedTasks = sortTasksForDisplay(cow.tasks);

  function handleEditSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setEditError(null);
    const formData = new FormData(event.currentTarget);

    startSaving(async () => {
      const result = await updateCow(cow.id, formData);
      if (result.success) {
        setIsEditing(false);
      } else {
        setEditError(result.error);
      }
    });
  }

  function handleDelete() {
    if (!window.confirm(`Remove ${cow.name} and all of its tasks?`)) return;
    startDeleting(async () => {
      await deleteCow(cow.id);
    });
  }

  return (
    <div
      className={cn(
        "rounded-lg border bg-white p-4 shadow-sm",
        overdueCount > 0 ? "border-red-300" : "border-slate-200"
      )}
    >
      {isEditing ? (
        <form ref={editFormRef} onSubmit={handleEditSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input name="name" defaultValue={cow.name} required maxLength={80} aria-label="Cow name" />
            <Input
              name="earTagNumber"
              defaultValue={cow.earTagNumber}
              required
              maxLength={40}
              aria-label="Ear tag number"
            />
          </div>
          {editError && (
            <p role="alert" className="text-sm text-red-600">
              {editError}
            </p>
          )}
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={isSaving}>
              {isSaving ? "Saving\u2026" : "Save"}
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold">{cow.name}</h3>
            <p className="text-sm text-slate-500">Ear tag #{cow.earTagNumber}</p>
            <p className={cn("mt-1 text-sm font-medium", overdueCount > 0 ? "text-red-600" : "text-slate-500")}>
              {outstandingCount === 0
                ? "All caught up"
                : `${outstandingCount} outstanding task${outstandingCount === 1 ? "" : "s"}${
                    overdueCount > 0 ? ` \u00b7 ${overdueCount} overdue` : ""
                  }`}
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
              Edit
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? "Removing\u2026" : "Delete"}
            </Button>
          </div>
        </div>
      )}

      <div className="mt-4 border-t border-slate-100 pt-4">
        {sortedTasks.length === 0 ? (
          <p className="text-sm text-slate-500">No tasks yet.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {sortedTasks.map((task) => (
              <TaskItem key={task.id} task={task} />
            ))}
          </ul>
        )}

        <div className="mt-3">
          <button
            type="button"
            onClick={() => setIsAddingTask((open) => !open)}
            className="text-sm font-medium text-emerald-700 underline-offset-2 hover:underline"
          >
            {isAddingTask ? "Close" : "Add task"}
          </button>
          {isAddingTask && (
            <div className="mt-3">
              <AddTaskForm cowId={cow.id} onAdded={() => setIsAddingTask(false)} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
