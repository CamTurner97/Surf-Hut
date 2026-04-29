import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

// vi.hoisted ensures these run before the module registry resolves imports
const { mockSelect, mockFrom, mockLeftJoin, mockOrderBy } = vi.hoisted(() => {
  const mockOrderBy = vi.fn();
  const mockLeftJoin = vi.fn(() => ({ orderBy: mockOrderBy }));
  const mockFrom = vi.fn(() => ({ leftJoin: mockLeftJoin }));
  const mockSelect = vi.fn(() => ({ from: mockFrom }));
  return { mockSelect, mockFrom, mockLeftJoin, mockOrderBy };
});

vi.mock("@workspace/db", () => ({
  db: { select: mockSelect },
  beachesTable: {},
  surfReportsTable: {},
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn(() => "eq"),
  asc: vi.fn(() => "asc"),
}));

import app from "../../app";

const BEACH_ROW = {
  id: "bondi",
  name: "Bondi",
  region: "eastern-suburbs",
  latitude: -33.89,
  longitude: 151.27,
  facingDirection: "E",
  description: "Iconic beach.",
  heroImageUrl: "/api/images/bondi.png",
  latestScore: 7,
  latestScoreLabel: "Good",
  latestReportFetchedAt: new Date("2024-01-01T12:00:00Z"),
};

describe("GET /api/beaches", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSelect.mockReturnValue({ from: mockFrom });
    mockFrom.mockReturnValue({ leftJoin: mockLeftJoin });
    mockLeftJoin.mockReturnValue({ orderBy: mockOrderBy });
  });

  it("returns 200 with beach list", async () => {
    mockOrderBy.mockResolvedValue([BEACH_ROW]);

    const res = await request(app).get("/api/beaches");

    expect(res.status).toBe(200);
    expect(res.body.count).toBe(1);
    expect(res.body.beaches[0].id).toBe("bondi");
    expect(res.body.beaches[0].latestScore).toBe(7);
    expect(res.body.beaches[0].latestScoreLabel).toBe("Good");
  });

  it("returns beaches with null scores when no reports cached", async () => {
    mockOrderBy.mockResolvedValue([
      {
        ...BEACH_ROW,
        latestScore: null,
        latestScoreLabel: null,
        latestReportFetchedAt: null,
      },
    ]);

    const res = await request(app).get("/api/beaches");

    expect(res.status).toBe(200);
    expect(res.body.beaches[0].latestScore).toBeNull();
    expect(res.body.beaches[0].latestScoreLabel).toBeNull();
  });

  it("returns 500 on database error", async () => {
    mockOrderBy.mockRejectedValue(new Error("db connection lost"));

    const res = await request(app).get("/api/beaches");
    expect(res.status).toBe(500);
  });

  it("returns correct count for multiple beaches", async () => {
    mockOrderBy.mockResolvedValue([
      BEACH_ROW,
      { ...BEACH_ROW, id: "bronte", name: "Bronte" },
    ]);

    const res = await request(app).get("/api/beaches");
    expect(res.body.count).toBe(2);
    expect(res.body.beaches).toHaveLength(2);
  });
});
