/**
 * The footer's Pacific sunset as pure functions of position and time: a dithered
 * sun half-set on the horizon, its glow, its rippled reflection, and the hairline
 * swell. `src/scripts/footer-sunset.ts` paints it. Units are CSS pixels and seconds.
 */

/** Swell lines from the horizon (index 0) toward the viewer. */
export const SWELL_LINES = 52;

/** Side of one dither pixel, in CSS pixels. */
export const DITHER_PX = 2;

const BAYER_4X4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(
  (rank) => (rank + 0.5) / 16
);

export interface Scene {
  readonly width: number;
  readonly height: number;
  /** Horizon y, snapped to the dither grid so the sun's flat base is a clean row. */
  readonly horizon: number;
  readonly centerX: number;
  readonly radius: number;
  /** How far the sun's centre sits below the horizon. */
  readonly sink: number;
}

export const sceneFor = (width: number, height: number): Scene => {
  const radius = Math.min(height * 0.38, width * 0.2);
  return {
    centerX: width / 2,
    height,
    horizon: Math.round((height * 0.42) / DITHER_PX) * DITHER_PX,
    radius,
    sink: radius * 0.18,
    width,
  };
};

// Smooth 3D value noise in [0, 1], from a fixed shuffle so every visit looks alike.
const PERMUTATION = (() => {
  const order = Array.from({ length: 256 }, (_, index) => index);
  for (let index = 255; index > 0; index -= 1) {
    const pick = Math.floor(
      ((((Math.sin(index * 12.9898) * 43_758.5453) % 1) + 1) % 1) * (index + 1)
    );
    [order[index], order[pick]] = [order[pick] ?? 0, order[index] ?? 0];
  }
  return [...order, ...order];
})();

const wrap = (value: number) => ((value % 256) + 256) % 256;
const smooth = (value: number) => value * value * (3 - 2 * value);
const mix = (from: number, to: number, amount: number) =>
  from + (to - from) * amount;

export const noise = (x: number, y: number, z: number): number => {
  const [cellX, cellY, cellZ] = [Math.floor(x), Math.floor(y), Math.floor(z)];
  const [u, v, w] = [smooth(x - cellX), smooth(y - cellY), smooth(z - cellZ)];
  const corner = (dx: number, dy: number, dz: number) => {
    const a = PERMUTATION[wrap(cellX + dx)] ?? 0;
    const b = PERMUTATION[a + wrap(cellY + dy)] ?? 0;
    return (PERMUTATION[b + wrap(cellZ + dz)] ?? 0) / 255;
  };
  return mix(
    mix(
      mix(corner(0, 0, 0), corner(1, 0, 0), u),
      mix(corner(0, 1, 0), corner(1, 1, 0), u),
      v
    ),
    mix(
      mix(corner(0, 0, 1), corner(1, 0, 1), u),
      mix(corner(0, 1, 1), corner(1, 1, 1), u),
      v
    ),
    w
  );
};

/** Ink density of the sun disc at an offset from its centre: solid low, thinning toward the top. */
const sunDensity = (scene: Scene, dx: number, dy: number): number => {
  const distance = Math.hypot(dx, dy);
  if (distance >= scene.radius) {
    return 0;
  }
  return (
    0.7 +
    0.5 * Math.min(1, (scene.radius - distance) / (scene.radius * 0.25)) +
    ((dy + scene.sink) / scene.radius) * 0.45
  );
};

/**
 * Ink density (0 = paper, 1 and up = solid) of the dithered layer at a point:
 * sun and sky glow above the horizon, the sun's rippled reflection below it.
 */
export const ditherDensity = (
  scene: Scene,
  x: number,
  y: number,
  time: number
): number => {
  const dx = x - scene.centerX;
  if (y < scene.horizon) {
    const dy = y - (scene.horizon + scene.sink);
    if (Math.hypot(dx, dy) < scene.radius) {
      return (
        sunDensity(scene, dx, dy) +
        (noise(dx * 0.02, y * 0.02, time * 0.25) - 0.5) * 0.12
      );
    }
    return (
      Math.max(0, 1 - Math.hypot(dx / 1.9, dy) / (scene.radius * 1.7)) ** 1.6 *
      0.5
    );
  }
  // Reflection: the sun flipped under the horizon, each row pushed sideways by the waves.
  const below = y - scene.horizon;
  const depth = below / (scene.height - scene.horizon);
  const fade = Math.max(0, 0.85 - depth * 1.6);
  if (fade === 0) {
    return 0;
  }
  const shift =
    Math.sin(y * 0.12 - time * 2) * (2 + depth * 14) +
    (noise(y * 0.05, time * 0.4, 3) - 0.5) * (4 + depth * 24);
  const density =
    sunDensity(scene, dx + shift, -(below * 0.95 + scene.sink)) * fade;
  // Every third row thinned: wave troughs.
  return Math.floor(y / DITHER_PX) % 3 === 0 ? density * 0.25 : density;
};

/** Ordered (Bayer) dithering: whether the dither pixel at this column and row is inked. */
export const isInked = (
  density: number,
  column: number,
  row: number
): boolean => density > (BAYER_4X4[(row % 4) * 4 + (column % 4)] ?? 1);

/** Height of swell line `line` at `x`: flat at the horizon, rolling harder toward the viewer. */
export const swellY = (
  scene: Scene,
  x: number,
  line: number,
  time: number
): number => {
  if (line === 0) {
    return scene.horizon;
  }
  const depth = line / (SWELL_LINES - 1);
  const rest =
    scene.horizon + depth ** 1.9 * (scene.height - scene.horizon) * 1.02;
  const amplitude = 2 + depth * 22;
  return (
    rest +
    (noise(x * (0.004 / (0.35 + depth)), line * 0.18, time * 0.18) - 0.5) *
      amplitude *
      2 +
    Math.sin(x * 0.006 + time * 0.6 + line * 0.5) * amplitude * 0.35
  );
};
