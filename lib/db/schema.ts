import { randomUUID } from "node:crypto";
import { relations, sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const cows = sqliteTable("cows", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => randomUUID()),
  name: text("name").notNull(),
  earTagNumber: text("ear_tag_number").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const tasks = sqliteTable("tasks", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => randomUUID()),
  cowId: text("cow_id")
    .notNull()
    .references(() => cows.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  // Stored as an ISO date string (YYYY-MM-DD). Tasks track a due day, not a
  // specific time, so a plain date string avoids timezone-shift bugs that a
  // timestamp column would introduce when comparing "is this overdue".
  dueDate: text("due_date").notNull(),
  isDone: integer("is_done", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const cowsRelations = relations(cows, ({ many }) => ({
  tasks: many(tasks),
}));

export const tasksRelations = relations(tasks, ({ one }) => ({
  cow: one(cows, { fields: [tasks.cowId], references: [cows.id] }),
}));

export type Cow = typeof cows.$inferSelect;
export type NewCow = typeof cows.$inferInsert;
export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;
