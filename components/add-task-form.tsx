"use client";

import { useRef, useState, useTransition } from "react";
import { createTask } from "@/app/actions/tasks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AddTaskForm({ cowId, onAdded }: { cowId: string; onAdded?: () => void }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await createTask(cowId, formData);
      if (result.success) {
        formRef.current?.reset();
        onAdded?.();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="flex-1">
        <label htmlFor={`task-title-${cowId}`} className="mb-1 block text-sm font-medium">
          Task
        </label>
        <Input id={`task-title-${cowId}`} name="title" placeholder="Hoof check" required maxLength={120} />
      </div>
      <div>
        <label htmlFor={`task-due-${cowId}`} className="mb-1 block text-sm font-medium">
          Due date
        </label>
        <Input id={`task-due-${cowId}`} name="dueDate" type="date" required />
      </div>
      <Button type="submit" size="sm" disabled={isPending}>
        {isPending ? "Adding\u2026" : "Add task"}
      </Button>
      {error && (
        <p role="alert" className="text-sm text-red-600 sm:basis-full">
          {error}
        </p>
      )}
    </form>
  );
}
