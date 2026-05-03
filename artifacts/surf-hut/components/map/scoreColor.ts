/** Sunset orange — Epic */
export const COLOR_EPIC = "#E36322";
/** Teal — Good */
export const COLOR_GOOD = "#1F8A8A";
/** Amber — Fair */
export const COLOR_FAIR = "#C4921B";
/** Grey — Poor */
export const COLOR_POOR = "#8E8E8E";
/** Light grey — Flat or no data */
export const COLOR_FLAT = "#B8B0A6";

export type ScoreLabel = "Epic" | "Good" | "Fair" | "Poor" | "Flat";

/**
 * Returns the brand colour for a beach pin based on its score label.
 * Falls back to the no-data colour when label is null/undefined.
 */
export function pinColor(label: ScoreLabel | string | null | undefined): string {
  switch (label) {
    case "Epic":
      return COLOR_EPIC;
    case "Good":
      return COLOR_GOOD;
    case "Fair":
      return COLOR_FAIR;
    case "Poor":
      return COLOR_POOR;
    case "Flat":
    default:
      return COLOR_FLAT;
  }
}
