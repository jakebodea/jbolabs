import {
  DITHER_PX,
  SWELL_LINES,
  ditherDensity,
  isInked,
  sceneFor,
  swellReach,
  swellY,
} from "@/lib/sunset";
import type { Scene } from "@/lib/sunset";

/*
 * Paints the footer sunset (src/lib/sunset.ts) into each `[data-footer-sunset]`
 * canvas. It animates only while on screen, holds one still frame for visitors
 * who ask for less motion, and repaints when the theme flips the `--signal` blue.
 */

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

/** `--signal` as RGB bytes, resolved by the canvas itself (the token is oklch). */
const signalRgb = (
  scratch: CanvasRenderingContext2D,
  signal: string
): readonly [number, number, number] => {
  scratch.clearRect(0, 0, 1, 1);
  scratch.fillStyle = signal;
  scratch.fillRect(0, 0, 1, 1);
  const [red = 0, green = 0, blue = 0] = scratch.getImageData(0, 0, 1, 1).data;
  return [red, green, blue];
};

const paintDither = (
  layer: CanvasRenderingContext2D,
  scene: Scene,
  rgb: readonly [number, number, number],
  time: number
) => {
  const columns = Math.ceil(scene.width / DITHER_PX);
  const rows = Math.ceil(scene.height / DITHER_PX);
  const image = layer.createImageData(columns, rows);
  for (let row = 0; row < rows; row += 1) {
    const y = (row + 0.5) * DITHER_PX;
    for (let column = 0; column < columns; column += 1) {
      if (
        isInked(
          ditherDensity(scene, (column + 0.5) * DITHER_PX, y, time),
          column,
          row
        )
      ) {
        const offset = (row * columns + column) * 4;
        [image.data[offset], image.data[offset + 1], image.data[offset + 2]] =
          rgb;
        image.data[offset + 3] = 255;
      }
    }
  }
  layer.putImageData(image, 0, 0);
};

/** Gradient stops across a swell line: smoothstep from clear at each end to solid in the middle. */
const FADE_STOPS = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1].map(
  (stop) => {
    const edge = Math.min(1, Math.min(stop, 1 - stop) / 0.4);
    return [stop, Number((edge * edge * (3 - 2 * edge)).toFixed(3))] as const;
  }
);

const paintSwell = (
  context: CanvasRenderingContext2D,
  scene: Scene,
  rgb: readonly [number, number, number],
  time: number
) => {
  for (let line = 0; line < SWELL_LINES; line += 1) {
    const depth = line / (SWELL_LINES - 1);
    context.beginPath();
    for (let x = 0; x <= scene.width + 6; x += 6) {
      context.lineTo(x, swellY(scene, x, line, time));
    }
    // Each line fades out on both sides, eased so the sea dissolves rather than stops.
    const reach = swellReach(scene, line);
    const fadeOut = context.createLinearGradient(
      scene.centerX - reach,
      0,
      scene.centerX + reach,
      0
    );
    for (const [stop, alpha] of FADE_STOPS) {
      fadeOut.addColorStop(stop, `rgb(${rgb.join(" ")} / ${alpha})`);
    }
    context.strokeStyle = fadeOut;
    if (line === 0) {
      // The horizon: a faint hairline.
      context.globalAlpha = 0.45;
      context.lineWidth = 0.6;
    } else {
      context.globalAlpha = 0.12 + depth * 0.75;
      context.lineWidth = 0.6 + depth * 0.9;
    }
    context.stroke();
  }
  context.globalAlpha = 1;
};

const mount = (canvas: HTMLCanvasElement) => {
  const context = canvas.getContext("2d");
  const layerCanvas = document.createElement("canvas");
  const layer = layerCanvas.getContext("2d", { willReadFrequently: true });
  if (!(context && layer)) {
    return;
  }
  let visible = false;
  let frame = 0;

  const paint = (time: number) => {
    const { width, height } = canvas.getBoundingClientRect();
    if (width === 0 || height === 0) {
      return;
    }
    const ratio = Math.min(window.devicePixelRatio, 2);
    if (
      canvas.width !== Math.round(width * ratio) ||
      canvas.height !== Math.round(height * ratio)
    ) {
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
    }
    const scene = sceneFor(width, height);
    const signal = getComputedStyle(canvas).getPropertyValue("--signal").trim();
    const rgb = signalRgb(layer, signal);
    layerCanvas.width = Math.ceil(width / DITHER_PX);
    layerCanvas.height = Math.ceil(height / DITHER_PX);
    paintDither(layer, scene, rgb, time);

    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.clearRect(0, 0, width, height);
    context.imageSmoothingEnabled = false;
    context.drawImage(
      layerCanvas,
      0,
      0,
      layerCanvas.width * DITHER_PX,
      layerCanvas.height * DITHER_PX
    );
    paintSwell(context, scene, rgb, time);
  };

  const tick = (now: number) => {
    paint(now / 1000);
    frame = visible && !reducedMotion.matches ? requestAnimationFrame(tick) : 0;
  };
  const restart = () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(tick);
  };

  new ResizeObserver(restart).observe(canvas);
  new IntersectionObserver(([entry]) => {
    visible = entry?.isIntersecting ?? false;
    restart();
  }).observe(canvas);
  // base.astro and the theme toggle flip `.dark` on <html>, which changes `--signal`.
  new MutationObserver(restart).observe(document.documentElement, {
    attributeFilter: ["class"],
  });
  reducedMotion.addEventListener("change", restart);
};

for (const canvas of document.querySelectorAll<HTMLCanvasElement>(
  "[data-footer-sunset]"
)) {
  mount(canvas);
}
