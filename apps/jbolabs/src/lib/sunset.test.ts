import { describe, expect, it } from "vitest";

import { ditherDensity, isInked, sceneFor, swellY } from "./sunset.ts";

const cells = Array.from(
  { length: 16 },
  (_, index) => [index % 4, Math.floor(index / 4)] as const
);

describe(sceneFor, () => {
  it("puts the horizon on the dither grid and sizes the sun by height on wide screens", () => {
    const scene = sceneFor(1280, 300);
    expect(scene.horizon).toBe(126);
    expect(scene.centerX).toBe(640);
    expect(scene.radius).toBeCloseTo(114);
  });

  it("sizes the sun by width on a phone", () => {
    expect(sceneFor(375, 240).radius).toBeCloseTo(75);
  });
});

describe(ditherDensity, () => {
  const scene = sceneFor(1280, 300);

  it("inks the sun solid just above the horizon", () => {
    const density = ditherDensity(scene, 640, 124, 0);
    expect(
      cells.filter(([column, row]) => isInked(density, column, row))
    ).toHaveLength(16);
  });

  it("leaves the far sky corner and the water nearest the viewer blank", () => {
    expect(ditherDensity(scene, 1, 1, 0)).toBe(0);
    expect(ditherDensity(scene, 640, 299, 0)).toBe(0);
  });
});

describe(isInked, () => {
  it("inks half of a 4x4 block at half density", () => {
    expect(
      cells.filter(([column, row]) => isInked(0.5, column, row))
    ).toHaveLength(8);
  });
});

describe(swellY, () => {
  it("keeps the horizon line flat whatever the time", () => {
    expect(
      [0, 400, 1279].map((x) => swellY(sceneFor(1280, 300), x, 0, 12.5))
    ).toStrictEqual([126, 126, 126]);
  });
});
