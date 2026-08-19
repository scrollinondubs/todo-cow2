import { z } from "zod";

export const cowFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(80, "Name is too long."),
  earTagNumber: z
    .string()
    .trim()
    .min(1, "Ear tag number is required.")
    .max(40, "Ear tag number is too long."),
});

export const taskFormSchema = z.object({
  title: z.string().trim().min(1, "Title is required.").max(120, "Title is too long."),
  dueDate: z
    .string()
    .trim()
    .min(1, "Due date is required.")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Due date must be a valid date."),
});
