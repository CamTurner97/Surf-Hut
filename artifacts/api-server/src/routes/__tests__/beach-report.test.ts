import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ---- Mock the service layer before app is imported ----
vi.mock("../../lib/surf-reports-service", () => ({
  getBeachById: vi.fn(),
  getOrFetchSurfReport: vi.fn(),
}));

import app from "../../app";
import { getBeachById, getOrFetchSurfReport } from "../../lib/surf-reports-service";

const BEACH = {
  id: "bondi",
  latitude: -33.89,
  longitude: 151.27,
  facingDirection: "E" as const,
};

const REPORT = {
  beachId: "bondi",
  score: 7,
  scoreLabel: "Good" as const,
  waveHeightM: 1.2,
  wavePeriodS: 10,
  waveDirectionDeg: 95,
  windSpeedKmh: 15,
  windDirectionDeg: 270,
  windRelative: "offshore" as const,
  airTemperatureC: 22,
  waterTemperatureC: 21,
  seaLevelM: 0.3,
  fetchedAt: new Date("2024-01-01T12:00:00Z"),
};

describe("GET /api/beaches/:beachId/report", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 200 with surf report for a known beach", async () => {
    vi.mocked(getBeachById).mockResolvedValue(BEACH);
    vi.mocked(getOrFetchSurfReport).mockResolvedValue({ report: REPORT, cached: false });

    const res = await request(app).get("/api/beaches/bondi/report");

    expect(res.status).toBe(200);
    expect(res.body.beachId).toBe("bondi");
    expect(res.body.score).toBe(7);
    expect(res.body.scoreLabel).toBe("Good");
    expect(res.body.waveHeightM).toBe(1.2);
    expect(res.body.cached).toBe(false);
  });

  it("includes cached flag in response", async () => {
    vi.mocked(getBeachById).mockResolvedValue(BEACH);
    vi.mocked(getOrFetchSurfReport).mockResolvedValue({ report: REPORT, cached: true });

    const res = await request(app).get("/api/beaches/bondi/report");

    expect(res.status).toBe(200);
    expect(res.body.cached).toBe(true);
  });

  it("returns 404 for unknown beach", async () => {
    vi.mocked(getBeachById).mockResolvedValue(null);

    const res = await request(app).get("/api/beaches/atlantis/report");

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("not_found");
  });

  it("returns 500 when service throws", async () => {
    vi.mocked(getBeachById).mockResolvedValue(BEACH);
    vi.mocked(getOrFetchSurfReport).mockRejectedValue(new Error("upstream error"));

    const res = await request(app).get("/api/beaches/bondi/report");
    expect(res.status).toBe(500);
  });

  it("passes the beachId to getBeachById", async () => {
    vi.mocked(getBeachById).mockResolvedValue(null);

    await request(app).get("/api/beaches/maroubra/report");
    expect(getBeachById).toHaveBeenCalledWith("maroubra");
  });
});
