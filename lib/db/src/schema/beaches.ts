import {
  doublePrecision,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const beachesTable = pgTable("beaches", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  region: text("region").notNull(),
  latitude: doublePrecision("latitude").notNull(),
  longitude: doublePrecision("longitude").notNull(),
  facingDirection: text("facing_direction").notNull(),
  description: text("description").notNull(),
  heroImageUrl: text("hero_image_url").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertBeachSchema = createInsertSchema(beachesTable).omit({
  createdAt: true,
  updatedAt: true,
});
export type InsertBeach = z.infer<typeof insertBeachSchema>;
export type BeachRow = typeof beachesTable.$inferSelect;
