import {
  beachesTable,
  db,
  surfReportsTable,
  type SurfReportRow,
} from "@workspace/db";
import { eq, sql } from "drizzle-orm";

import { logger } from "./logger";
import { fetchOpenMeteoSnapshot } from "./open-meteo";
import {
  classifyWind,
  computeSurfScore,
  type FacingDirection,
} from "./surf-score";

export const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

export interface BeachLocation {
  id: string;
  latitude: number;
  longitude: number;
  facingDirection: FacingDirection;
}

export async function getBeachById(
  beachId: string,
): Promise<BeachLocation | null> {
  const rows = await db
    .select({
      id: beachesTable.id,
      latitude: beachesTable.latitude,
      longitude: beachesTable.longitude,
      facingDirection: beachesTable.facingDirection,
    })
    .from(beachesTable)
    .where(eq(beachesTable.id, beachId))
    .limit(1);
  const row = rows[0];
  if (!row) return null;
  return {
    id: row.id,
    latitude: row.latitude,
    longitude: row.longitude,
    facingDirection: row.facingDirection as FacingDirection,
  };
}

export function isFresh(row: SurfReportRow, now: Date = new Date()): boolean {
  return now.getTime() - row.fetchedAt.getTime() < CACHE_TTL_MS;
}

async function readCached(beachId: string): Promise<SurfReportRow | null> {
  const rows = await db
    .select()
    .from(surfReportsTable)
    .where(eq(surfReportsTable.beachId, beachId))
    .limit(1);
  return rows[0] ?? null;
}

export interface BuiltReport {
  beachId: string;
  score: number;
  scoreLabel: "Flat" | "Poor" | "Fair" | "Good" | "Epic";
  waveHeightM: number;
  wavePeriodS: number;
  waveDirectionDeg: number;
  windSpeedKmh: number;
  windDirectionDeg: number;
  windRelative: "offshore" | "cross-shore" | "onshore";
  airTemperatureC: number | null;
  waterTemperatureC: number | null;
  seaLevelM: number | null;
  fetchedAt: Date;
}

function rowToReport(row: SurfReportRow): BuiltReport {
  return {
    beachId: row.beachId,
    score: row.score,
    scoreLabel: row.scoreLabel as BuiltReport["scoreLabel"],
    waveHeightM: row.waveHeightM,
    wavePeriodS: row.wavePeriodS,
    waveDirectionDeg: row.waveDirectionDeg,
    windSpeedKmh: row.windSpeedKmh,
    windDirectionDeg: row.windDirectionDeg,
    windRelative: row.windRelative as BuiltReport["windRelative"],
    airTemperatureC: row.airTemperatureC,
    waterTemperatureC: row.waterTemperatureC,
    seaLevelM: row.seaLevelM,
    fetchedAt: row.fetchedAt,
  };
}

async function fetchAndCache(beach: BeachLocation): Promise<BuiltReport> {
  const snap = await fetchOpenMeteoSnapshot(beach.latitude, beach.longitude);
  const windRelative = classifyWind(snap.windDirectionDeg, beach.facingDirection);
  const { score, label } = computeSurfScore({
    waveHeightM: snap.waveHeightM,
    wavePeriodS: snap.wavePeriodS,
    windSpeedKmh: snap.windSpeedKmh,
    windRelative,
  });

  const insertValues = {
    beachId: beach.id,
    score,
    scoreLabel: label,
    waveHeightM: snap.waveHeightM,
    wavePeriodS: snap.wavePeriodS,
    waveDirectionDeg: snap.waveDirectionDeg,
    windSpeedKmh: snap.windSpeedKmh,
    windDirectionDeg: snap.windDirectionDeg,
    windRelative,
    airTemperatureC: snap.airTemperatureC,
    waterTemperatureC: snap.waterTemperatureC,
    seaLevelM: snap.seaLevelM,
    raw: snap.raw,
    fetchedAt: snap.fetchedAt,
  };

  await db
    .insert(surfReportsTable)
    .values(insertValues)
    .onConflictDoUpdate({
      target: surfReportsTable.beachId,
      set: {
        score: insertValues.score,
        scoreLabel: insertValues.scoreLabel,
        waveHeightM: insertValues.waveHeightM,
        wavePeriodS: insertValues.wavePeriodS,
        waveDirectionDeg: insertValues.waveDirectionDeg,
        windSpeedKmh: insertValues.windSpeedKmh,
        windDirectionDeg: insertValues.windDirectionDeg,
        windRelative: insertValues.windRelative,
        airTemperatureC: insertValues.airTemperatureC,
        waterTemperatureC: insertValues.waterTemperatureC,
        seaLevelM: insertValues.seaLevelM,
        raw: insertValues.raw,
        fetchedAt: insertValues.fetchedAt,
        updatedAt: sql`now()`,
      },
    });

  return {
    beachId: beach.id,
    score,
    scoreLabel: label,
    waveHeightM: snap.waveHeightM,
    wavePeriodS: snap.wavePeriodS,
    waveDirectionDeg: snap.waveDirectionDeg,
    windSpeedKmh: snap.windSpeedKmh,
    windDirectionDeg: snap.windDirectionDeg,
    windRelative,
    airTemperatureC: snap.airTemperatureC,
    waterTemperatureC: snap.waterTemperatureC,
    seaLevelM: snap.seaLevelM,
    fetchedAt: snap.fetchedAt,
  };
}

export async function getOrFetchSurfReport(
  beach: BeachLocation,
): Promise<{ report: BuiltReport; cached: boolean }> {
  const existing = await readCached(beach.id);
  if (existing && isFresh(existing)) {
    return { report: rowToReport(existing), cached: true };
  }
  try {
    const report = await fetchAndCache(beach);
    return { report, cached: false };
  } catch (err) {
    if (existing) {
      logger.warn(
        { err, beachId: beach.id },
        "Open-Meteo fetch failed, serving stale cache",
      );
      return { report: rowToReport(existing), cached: true };
    }
    throw err;
  }
}
