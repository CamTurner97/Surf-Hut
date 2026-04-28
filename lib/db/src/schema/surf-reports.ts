import {
  doublePrecision,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const surfReportsTable = pgTable("surf_reports", {
  beachId: text("beach_id").primaryKey(),
  score: integer("score").notNull(),
  scoreLabel: text("score_label").notNull(),
  waveHeightM: doublePrecision("wave_height_m").notNull(),
  wavePeriodS: doublePrecision("wave_period_s").notNull(),
  waveDirectionDeg: doublePrecision("wave_direction_deg").notNull(),
  windSpeedKmh: doublePrecision("wind_speed_kmh").notNull(),
  windDirectionDeg: doublePrecision("wind_direction_deg").notNull(),
  windRelative: text("wind_relative").notNull(),
  airTemperatureC: doublePrecision("air_temperature_c"),
  waterTemperatureC: doublePrecision("water_temperature_c"),
  seaLevelM: doublePrecision("sea_level_m"),
  raw: jsonb("raw"),
  fetchedAt: timestamp("fetched_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertSurfReportSchema = createInsertSchema(surfReportsTable).omit(
  {
    updatedAt: true,
  },
);
export type InsertSurfReport = z.infer<typeof insertSurfReportSchema>;
export type SurfReportRow = typeof surfReportsTable.$inferSelect;
