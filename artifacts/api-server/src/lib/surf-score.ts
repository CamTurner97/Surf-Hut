export type FacingDirection = "N" | "NE" | "E" | "SE" | "S";
export type WindRelative = "offshore" | "cross-shore" | "onshore";
export type ScoreLabel = "Flat" | "Poor" | "Fair" | "Good" | "Epic";

const FACING_TO_DEGREES: Record<FacingDirection, number> = {
  N: 0,
  NE: 45,
  E: 90,
  SE: 135,
  S: 180,
};

/**
 * Smallest absolute difference between two compass bearings, in degrees [0, 180].
 */
export function bearingDelta(a: number, b: number): number {
  const diff = Math.abs(((a - b + 540) % 360) - 180);
  return diff;
}

/**
 * Classify wind relative to the beach facing direction.
 * Offshore wind blows FROM the land TOWARDS the sea, so its "from" bearing
 * is opposite the beach facing.
 */
export function classifyWind(
  windFromDeg: number,
  facing: FacingDirection,
): WindRelative {
  const facingDeg = FACING_TO_DEGREES[facing];
  const offshoreFromDeg = (facingDeg + 180) % 360;
  const deltaToOffshore = bearingDelta(windFromDeg, offshoreFromDeg);
  if (deltaToOffshore <= 45) return "offshore";
  const deltaToOnshore = bearingDelta(windFromDeg, facingDeg);
  if (deltaToOnshore <= 45) return "onshore";
  return "cross-shore";
}

interface ScoreInput {
  waveHeightM: number;
  wavePeriodS: number;
  windSpeedKmh: number;
  windRelative: WindRelative;
}

/**
 * Compute a 1-10 surf score from the snapshot.
 * Heuristic that rewards waist-to-overhead waves, longer period (groundswell),
 * and offshore/light winds.
 */
export function computeSurfScore(input: ScoreInput): {
  score: number;
  label: ScoreLabel;
} {
  const { waveHeightM, wavePeriodS, windSpeedKmh, windRelative } = input;

  // Wave size: ideal 0.8 - 2.0m
  let sizePts = 0;
  if (waveHeightM < 0.2) sizePts = 0;
  else if (waveHeightM < 0.5) sizePts = 1;
  else if (waveHeightM < 0.8) sizePts = 2.5;
  else if (waveHeightM <= 2.0) sizePts = 4;
  else if (waveHeightM <= 3.0) sizePts = 2.5;
  else sizePts = 1;

  // Wave period: longer is cleaner
  let periodPts = 0;
  if (wavePeriodS < 5) periodPts = 0;
  else if (wavePeriodS < 7) periodPts = 1;
  else if (wavePeriodS < 9) periodPts = 1.5;
  else if (wavePeriodS < 12) periodPts = 2.5;
  else periodPts = 3;

  // Wind: offshore best, onshore worst, light wind always helps
  let windPts = 0;
  if (windRelative === "offshore") {
    if (windSpeedKmh < 25) windPts = 3;
    else if (windSpeedKmh < 40) windPts = 2;
    else windPts = 1;
  } else if (windRelative === "cross-shore") {
    if (windSpeedKmh < 15) windPts = 2;
    else if (windSpeedKmh < 30) windPts = 1;
    else windPts = 0.5;
  } else {
    if (windSpeedKmh < 10) windPts = 1.5;
    else if (windSpeedKmh < 20) windPts = 1;
    else windPts = 0;
  }

  const raw = sizePts + periodPts + windPts; // 0 - 10
  let score = Math.round(raw);
  if (score < 1) score = 1;
  if (score > 10) score = 10;

  let label: ScoreLabel;
  if (waveHeightM < 0.2) label = "Flat";
  else if (score <= 3) label = "Poor";
  else if (score <= 5) label = "Fair";
  else if (score <= 8) label = "Good";
  else label = "Epic";

  return { score, label };
}
