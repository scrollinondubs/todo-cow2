"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { tasks } from "@/lib/db/schema";
import { taskFormSchema } from "@/lib/validations";

type ActionResult = { success: true } | { success: false; error: string };

export async function createTask(cowId: string, formData: FormData): Promise<ActionResult> {
  const parsed = taskFormSchema.safeParse({
    title: formData.get("title"),
    dueDate: formData.get("dueDate"),
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  await db.insert(tasks).values({ cowId, ...parsed.data });

  revalidatePath("/");
  return { success: true };
}

export async function toggleTask(taskId: string, isDone: boolean): Promise<ActionResult> {
  await db
    .update(tasks)
    .set({ isDone, updatedAt: new Date() })
    .where(eq(tasks.id, taskId));

  revalidatePath("/");
  return { success: true };
}
