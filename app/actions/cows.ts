"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { cows } from "@/lib/db/schema";
import { cowFormSchema } from "@/lib/validations";

type ActionResult = { success: true } | { success: false; error: string };

function isUniqueConstraintError(error: unknown): boolean {
  return error instanceof Error && /unique constraint/i.test(error.message);
}

export async function createCow(formData: FormData): Promise<ActionResult> {
  const parsed = cowFormSchema.safeParse({
    name: formData.get("name"),
    earTagNumber: formData.get("earTagNumber"),
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  try {
    await db.insert(cows).values(parsed.data);
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return { success: false, error: "A cow with that ear tag number already exists." };
    }
    throw error;
  }

  revalidatePath("/");
  return { success: true };
}

export async function updateCow(cowId: string, formData: FormData): Promise<ActionResult> {
  const parsed = cowFormSchema.safeParse({
    name: formData.get("name"),
    earTagNumber: formData.get("earTagNumber"),
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  try {
    await db
      .update(cows)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(cows.id, cowId));
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return { success: false, error: "A cow with that ear tag number already exists." };
    }
    throw error;
  }

  revalidatePath("/");
  return { success: true };
}

export async function deleteCow(cowId: string): Promise<ActionResult> {
  await db.delete(cows).where(eq(cows.id, cowId));
  revalidatePath("/");
  return { success: true };
}
