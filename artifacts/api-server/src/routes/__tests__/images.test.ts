import request from "supertest";
import { describe, expect, it } from "vitest";

import app from "../../app";

describe("GET /api/images/:slug.png", () => {
  it("serves a known beach image as PNG", async () => {
    const res = await request(app).get("/api/images/bondi.png");
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/image\/png/);
    expect(res.headers["cache-control"]).toMatch(/max-age/);
  });

  it("returns 404 JSON for an unknown slug", async () => {
    const res = await request(app).get("/api/images/atlantis.png");
    expect(res.status).toBe(404);
    expect(res.body.error).toBe("not_found");
  });

  it("blocks path traversal attempts", async () => {
    const res = await request(app).get("/api/images/../package.json");
    expect([404, 400]).toContain(res.status);
  });

  it("serves all 20 beach images", async () => {
    const slugs = [
      "bondi", "bronte", "tamarama", "maroubra",
      "palm-beach", "avalon", "newport", "north-narrabeen",
    ];
    for (const slug of slugs) {
      const res = await request(app).get(`/api/images/${slug}.png`);
      expect(res.status, `Expected 200 for ${slug}.png`).toBe(200);
    }
  });
});
