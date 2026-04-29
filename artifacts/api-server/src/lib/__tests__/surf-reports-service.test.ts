import { beforeEach, describe, expect, it, vi } from "vitest";

import { CACHE_TTL_MS, isFresh } from "../surf-reports-service";
import type { SurfReportRow } from "@workspace/db";

// ---------------------------------------------------------------------------
// isFresh — pure function, no mocks needed
// ---------------------------------------------------------------------------
function makeRow(fetchedAt: Date): SurfReportRow {
  return {
    beachId: "bondi",
    score: 7,
    scoreLabel: "Good",
    waveHeightM: 1.2,
    wavePeriodS: 10,
    waveDirectionDeg: 95,
    windSpeedKmh: 15,
    windDirectionDeg: 270,
    windRelative: "offshore",
    airTemperatureC: 22,
    waterTemperatureC: 21,
    seaLevelM: 0.3,
    raw: null,
    fetchedAt,
    updatedAt: new Date(),
  };
}

describe("isFresh", () => {
  it("returns true when report was just fetched", () => {
    const row = makeRow(new Date());
    expect(isFresh(row)).toBe(true);
  });

  it("returns true when report is within the TTL", () => {
    const fetchedAt = new Date(Date.now() - CACHE_TTL_MS + 60_000);
    const row = makeRow(fetchedAt);
    expect(isFresh(row)).toBe(true);
  });

  it("returns false when report has just expired", () => {
    const fetchedAt = new Date(Date.now() - CACHE_TTL_MS - 1);
    const row = makeRow(fetchedAt);
    expect(isFresh(row)).toBe(false);
  });

  it("returns false for a report fetched hours ago", () => {
    const fetchedAt = new Date(Date.now() - 3 * 60 * 60 * 1000);
    const row = makeRow(fetchedAt);
    expect(isFresh(row)).toBe(false);
  });

  it("accepts a custom 'now' reference point", () => {
    const fetchedAt = new Date(1_000_000);
    const freshNow = new Date(1_000_000 + CACHE_TTL_MS - 1);
    const staleNow = new Date(1_000_000 + CACHE_TTL_MS + 1);
    expect(isFresh(makeRow(fetchedAt), freshNow)).toBe(true);
    expect(isFresh(makeRow(fetchedAt), staleNow)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// getOrFetchSurfReport — mocked db and open-meteo module
// ---------------------------------------------------------------------------
vi.mock("@workspace/db", () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
  },
  beachesTable: {},
  surfReportsTable: {},
}));

vi.mock("../open-meteo", () => ({
  fetchOpenMeteoSnapshot: vi.fn(),
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn(() => "eq-condition"),
  sql: vi.fn((strings: TemplateStringsArray) => strings[0]),
  asc: vi.fn(),
}));

import { db } from "@workspace/db";
import { fetchOpenMeteoSnapshot } from "../open-meteo";
import { getOrFetchSurfReport } from "../surf-reports-service";

const BEACH = {
  id: "bondi",
  latitude: -33.89,
  longitude: 151.27,
  facingDirection: "E" as const,
};

const SNAPSHOT = {
  waveHeightM: 1.2,
  wavePeriodS: 10,
  waveDirectionDeg: 95,
  windSpeedKmh: 15,
  windDirectionDeg: 270,
  airTemperatureC: 22,
  waterTemperatureC: 21,
  seaLevelM: 0.3,
  fetchedAt: new Date(),
  raw: { marine: {}, weather: {} } as { marine: unknown; weather: unknown },
};

function buildSelectChain(returnValue: unknown) {
  const chain = {
    select: vi.fn(),
    from: vi.fn(),
    where: vi.fn(),
    limit: vi.fn().mockResolvedValue(returnValue),
  };
  chain.select.mockReturnValue(chain);
  chain.from.mockReturnValue(chain);
  chain.where.mockReturnValue(chain);
  return chain;
}

function buildInsertChain() {
  const chain = {
    insert: vi.fn(),
    values: vi.fn(),
    onConflictDoUpdate: vi.fn().mockResolvedValue(undefined),
  };
  chain.insert.mockReturnValue(chain);
  chain.values.mockReturnValue(chain);
  return chain;
}

describe("getOrFetchSurfReport", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns cached report when still fresh", async () => {
    const freshRow = makeRow(new Date());
    const selectChain = buildSelectChain([freshRow]);
    vi.mocked(db.select).mockReturnValue(selectChain.select() as never);

    const { report, cached } = await getOrFetchSurfReport(BEACH);

    expect(cached).toBe(true);
    expect(report.beachId).toBe("bondi");
    expect(report.score).toBe(7);
    expect(fetchOpenMeteoSnapshot).not.toHaveBeenCalled();
  });

  it("fetches fresh data when cache is stale", async () => {
    const staleRow = makeRow(new Date(Date.now() - CACHE_TTL_MS - 1));
    const selectChain = buildSelectChain([staleRow]);
    vi.mocked(db.select).mockReturnValue(selectChain.select() as never);
    vi.mocked(fetchOpenMeteoSnapshot).mockResolvedValue(SNAPSHOT);

    const insertChain = buildInsertChain();
    vi.mocked(db.insert).mockReturnValue(insertChain.insert() as never);

    const { report, cached } = await getOrFetchSurfReport(BEACH);

    expect(cached).toBe(false);
    expect(fetchOpenMeteoSnapshot).toHaveBeenCalledWith(
      BEACH.latitude,
      BEACH.longitude,
    );
    expect(report.waveHeightM).toBe(SNAPSHOT.waveHeightM);
  });

  it("fetches fresh data when no cache exists", async () => {
    const selectChain = buildSelectChain([]);
    vi.mocked(db.select).mockReturnValue(selectChain.select() as never);
    vi.mocked(fetchOpenMeteoSnapshot).mockResolvedValue(SNAPSHOT);

    const insertChain = buildInsertChain();
    vi.mocked(db.insert).mockReturnValue(insertChain.insert() as never);

    const { report, cached } = await getOrFetchSurfReport(BEACH);

    expect(cached).toBe(false);
    expect(report.waveHeightM).toBe(SNAPSHOT.waveHeightM);
  });

  it("falls back to stale cache if fetch fails and stale row exists", async () => {
    const staleRow = makeRow(new Date(Date.now() - CACHE_TTL_MS - 1));
    const selectChain = buildSelectChain([staleRow]);
    vi.mocked(db.select).mockReturnValue(selectChain.select() as never);
    vi.mocked(fetchOpenMeteoSnapshot).mockRejectedValue(
      new Error("network error"),
    );

    const { report, cached } = await getOrFetchSurfReport(BEACH);

    expect(cached).toBe(true);
    expect(report.score).toBe(7);
  });

  it("throws when fetch fails and no cache exists", async () => {
    const selectChain = buildSelectChain([]);
    vi.mocked(db.select).mockReturnValue(selectChain.select() as never);
    vi.mocked(fetchOpenMeteoSnapshot).mockRejectedValue(
      new Error("network error"),
    );

    await expect(getOrFetchSurfReport(BEACH)).rejects.toThrow("network error");
  });

  it("computes wind relative to beach facing", async () => {
    const selectChain = buildSelectChain([]);
    vi.mocked(db.select).mockReturnValue(selectChain.select() as never);
    vi.mocked(fetchOpenMeteoSnapshot).mockResolvedValue({
      ...SNAPSHOT,
      windDirectionDeg: 270, // west wind on east-facing beach = offshore
    });

    const insertChain = buildInsertChain();
    vi.mocked(db.insert).mockReturnValue(insertChain.insert() as never);

    const { report } = await getOrFetchSurfReport(BEACH);
    expect(report.windRelative).toBe("offshore");
  });
});
