"use client";

import { useRef, useState, useTransition } from "react";
import { createCow } from "@/app/actions/cows";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AddCowForm({ onAdded }: { onAdded?: () => void }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await createCow(formData);
      if (result.success) {
        formRef.current?.reset();
        onAdded?.();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex-1">
          <label htmlFor="cow-name" className="mb-1 block text-sm font-medium">
            Name
          </label>
          <Input id="cow-name" name="name" placeholder="Bessie" required maxLength={80} />
        </div>
        <div className="flex-1">
          <label htmlFor="cow-ear-tag" className="mb-1 block text-sm font-medium">
            Ear tag number
          </label>
          <Input id="cow-ear-tag" name="earTagNumber" placeholder="482" required maxLength={40} />
        </div>
      </div>
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
      <Button type="submit" disabled={isPending}>
        {isPending ? "Adding\u2026" : "Add cow"}
      </Button>
    </form>
  );
}
