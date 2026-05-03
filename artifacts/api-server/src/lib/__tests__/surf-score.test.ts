import { describe, expect, it } from "vitest";

import {
  bearingDelta,
  classifyWind,
  computeSurfScore,
} from "../surf-score";

describe("bearingDelta", () => {
  it("returns 0 for identical bearings", () => {
    expect(bearingDelta(0, 0)).toBe(0);
    expect(bearingDelta(180, 180)).toBe(0);
    expect(bearingDelta(359, 359)).toBe(0);
  });

  it("returns 180 for opposite bearings", () => {
    expect(bearingDelta(0, 180)).toBe(180);
    expect(bearingDelta(90, 270)).toBe(180);
  });

  it("handles wrap-around correctly", () => {
    expect(bearingDelta(350, 10)).toBe(20);
    expect(bearingDelta(10, 350)).toBe(20);
    expect(bearingDelta(0, 359)).toBe(1);
  });

  it("returns correct delta for right angles", () => {
    expect(bearingDelta(0, 90)).toBe(90);
    expect(bearingDelta(90, 0)).toBe(90);
  });

  it("is symmetric", () => {
    expect(bearingDelta(45, 270)).toBe(bearingDelta(270, 45));
    expect(bearingDelta(100, 200)).toBe(bearingDelta(200, 100));
  });
});

describe("classifyWind", () => {
  it("classifies offshore wind for east-facing beach", () => {
    // East-facing (90°): offshore wind comes from west (270°)
    expect(classifyWind(270, "E")).toBe("offshore");
    expect(classifyWind(250, "E")).toBe("offshore"); // within 45° of 270
    expect(classifyWind(290, "E")).toBe("offshore");
  });

  it("classifies onshore wind for east-facing beach", () => {
    // East-facing: onshore wind comes from east (90°)
    expect(classifyWind(90, "E")).toBe("onshore");
    expect(classifyWind(70, "E")).toBe("onshore"); // within 45° of 90
    expect(classifyWind(110, "E")).toBe("onshore");
  });

  it("classifies cross-shore wind for east-facing beach", () => {
    expect(classifyWind(0, "E")).toBe("cross-shore");
    expect(classifyWind(180, "E")).toBe("cross-shore");
  });

  it("classifies offshore wind for north-facing beach", () => {
    // North-facing (0°): offshore comes from south (180°)
    expect(classifyWind(180, "N")).toBe("offshore");
    expect(classifyWind(160, "N")).toBe("offshore");
    expect(classifyWind(200, "N")).toBe("offshore");
  });

  it("classifies onshore wind for north-facing beach", () => {
    // North-facing: onshore is from north (0°/360°)
    expect(classifyWind(0, "N")).toBe("onshore");
    expect(classifyWind(350, "N")).toBe("onshore");
    expect(classifyWind(20, "N")).toBe("onshore");
  });

  it("classifies offshore for SE-facing beach", () => {
    // SE-facing (135°): offshore comes from NW (315°)
    expect(classifyWind(315, "SE")).toBe("offshore");
    expect(classifyWind(300, "SE")).toBe("offshore");
  });

  it("classifies onshore for SE-facing beach", () => {
    // SE-facing: onshore from SE (135°)
    expect(classifyWind(135, "SE")).toBe("onshore");
  });

  it("classifies offshore for NE-facing beach", () => {
    // NE-facing (45°): offshore from SW (225°)
    expect(classifyWind(225, "NE")).toBe("offshore");
  });

  it("classifies offshore for south-facing beach", () => {
    // S-facing (180°): offshore from north (0°/360°)
    expect(classifyWind(0, "S")).toBe("offshore");
    expect(classifyWind(350, "S")).toBe("offshore");
    expect(classifyWind(10, "S")).toBe("offshore");
  });
});

describe("computeSurfScore", () => {
  it("returns Flat label for tiny waves", () => {
    const { score, label } = computeSurfScore({
      waveHeightM: 0.1,
      wavePeriodS: 12,
      windSpeedKmh: 5,
      windRelative: "offshore",
    });
    expect(label).toBe("Flat");
    expect(score).toBeGreaterThanOrEqual(1);
  });

  it("returns high score for ideal conditions", () => {
    const { score, label } = computeSurfScore({
      waveHeightM: 1.5,
      wavePeriodS: 12,
      windSpeedKmh: 10,
      windRelative: "offshore",
    });
    expect(score).toBeGreaterThanOrEqual(8);
    expect(["Good", "Epic"]).toContain(label);
  });

  it("returns Epic for perfect conditions", () => {
    const { score, label } = computeSurfScore({
      waveHeightM: 1.8,
      wavePeriodS: 14,
      windSpeedKmh: 8,
      windRelative: "offshore",
    });
    expect(label).toBe("Epic");
    expect(score).toBeGreaterThanOrEqual(9);
  });

  it("returns Poor for choppy onshore conditions", () => {
    const { score, label } = computeSurfScore({
      waveHeightM: 0.6,
      wavePeriodS: 4,
      windSpeedKmh: 35,
      windRelative: "onshore",
    });
    expect(score).toBeLessThanOrEqual(3);
    expect(label).toBe("Poor");
  });

  it("returns Fair for average conditions", () => {
    const { score, label } = computeSurfScore({
      waveHeightM: 0.8,
      wavePeriodS: 7,
      windSpeedKmh: 20,
      windRelative: "cross-shore",
    });
    expect(["Fair", "Good"]).toContain(label);
  });

  it("clamps score to minimum 1", () => {
    const { score } = computeSurfScore({
      waveHeightM: 0,
      wavePeriodS: 0,
      windSpeedKmh: 60,
      windRelative: "onshore",
    });
    expect(score).toBeGreaterThanOrEqual(1);
  });

  it("clamps score to maximum 10", () => {
    const { score } = computeSurfScore({
      waveHeightM: 2.0,
      wavePeriodS: 15,
      windSpeedKmh: 5,
      windRelative: "offshore",
    });
    expect(score).toBeLessThanOrEqual(10);
  });

  it("penalises very large waves", () => {
    const bigWaves = computeSurfScore({
      waveHeightM: 4.0,
      wavePeriodS: 14,
      windSpeedKmh: 5,
      windRelative: "offshore",
    });
    const idealWaves = computeSurfScore({
      waveHeightM: 1.5,
      wavePeriodS: 14,
      windSpeedKmh: 5,
      windRelative: "offshore",
    });
    expect(bigWaves.score).toBeLessThan(idealWaves.score);
  });

  it("rewards longer period over shorter period", () => {
    const longPeriod = computeSurfScore({
      waveHeightM: 1.2,
      wavePeriodS: 14,
      windSpeedKmh: 10,
      windRelative: "offshore",
    });
    const shortPeriod = computeSurfScore({
      waveHeightM: 1.2,
      wavePeriodS: 5,
      windSpeedKmh: 10,
      windRelative: "offshore",
    });
    expect(longPeriod.score).toBeGreaterThan(shortPeriod.score);
  });

  it("rewards offshore wind over onshore", () => {
    const offshore = computeSurfScore({
      waveHeightM: 1.2,
      wavePeriodS: 10,
      windSpeedKmh: 15,
      windRelative: "offshore",
    });
    const onshore = computeSurfScore({
      waveHeightM: 1.2,
      wavePeriodS: 10,
      windSpeedKmh: 15,
      windRelative: "onshore",
    });
    expect(offshore.score).toBeGreaterThan(onshore.score);
  });

  it("cross-shore light wind scores better than cross-shore strong wind", () => {
    const light = computeSurfScore({
      waveHeightM: 1.2,
      wavePeriodS: 10,
      windSpeedKmh: 10,
      windRelative: "cross-shore",
    });
    const strong = computeSurfScore({
      waveHeightM: 1.2,
      wavePeriodS: 10,
      windSpeedKmh: 40,
      windRelative: "cross-shore",
    });
    expect(light.score).toBeGreaterThan(strong.score);
  });
});
