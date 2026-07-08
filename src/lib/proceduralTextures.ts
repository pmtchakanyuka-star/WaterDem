import * as THREE from "three";

/**
 * Small procedural material textures painted on an offscreen canvas — wood
 * planks and ceramic tiles — so floors and surfaces read as real materials
 * instead of flat color, with zero network assets (CSP-safe). Client-only
 * (needs `document`); the 3D bundle is already ssr:false. Textures are cached
 * per palette so we paint each one once.
 */

const cache = new Map<string, THREE.Texture>();

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

function rgb(r: number, g: number, b: number, a = 1) {
  const c = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
  return `rgba(${c(r)},${c(g)},${c(b)},${a})`;
}

// deterministic pseudo-random so a given palette always paints the same way
function makeRng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function seedFrom(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h;
}

function finish(canvas: HTMLCanvasElement, key: string, repeat: number): THREE.Texture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeat, repeat);
  tex.anisotropy = 8;
  tex.colorSpace = THREE.SRGBColorSpace;
  cache.set(key, tex);
  return tex;
}

/** Wood floor: vertical planks with tonal variation, grain streaks, seams. */
export function woodTexture(base: string, repeat = 2.5): THREE.Texture | null {
  if (typeof document === "undefined") return null;
  const key = `wood:${base}:${repeat}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const g = canvas.getContext("2d");
  if (!g) return null;
  const [r, gr, b] = hexToRgb(base);
  const rand = makeRng(seedFrom(key));

  g.fillStyle = rgb(r, gr, b);
  g.fillRect(0, 0, size, size);

  const planks = 5;
  const pw = size / planks;
  for (let p = 0; p < planks; p++) {
    const x = p * pw;
    const tone = (rand() - 0.5) * 26;
    g.fillStyle = rgb(r + tone, gr + tone, b + tone);
    g.fillRect(x, 0, pw, size);

    // grain streaks
    for (let s = 0; s < 22; s++) {
      const gx = x + rand() * pw;
      const dark = -(6 + rand() * 16);
      g.strokeStyle = rgb(r + tone + dark, gr + tone + dark, b + tone + dark, 0.5);
      g.lineWidth = 0.6 + rand() * 1.1;
      g.beginPath();
      g.moveTo(gx, 0);
      let cx = gx;
      for (let y = 0; y <= size; y += 32) {
        cx += (rand() - 0.5) * 5;
        g.lineTo(cx, y);
      }
      g.stroke();
    }

    // occasional end-joint across a plank
    const jy = Math.floor(rand() * planks) * pw;
    g.strokeStyle = rgb(r - 24, gr - 24, b - 24, 0.6);
    g.lineWidth = 1.5;
    g.beginPath();
    g.moveTo(x, jy);
    g.lineTo(x + pw, jy);
    g.stroke();

    // seam between planks
    g.strokeStyle = rgb(r - 34, gr - 34, b - 34, 0.85);
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(x, 0);
    g.lineTo(x, size);
    g.stroke();
  }

  return finish(canvas, key, repeat);
}

/** Daylight seen through a window: warm sky fading to a soft horizon + sun. */
export function skyTexture(): THREE.Texture | null {
  if (typeof document === "undefined") return null;
  const key = "sky";
  const hit = cache.get(key);
  if (hit) return hit;

  const w = 256;
  const h = 256;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const g = canvas.getContext("2d");
  if (!g) return null;

  const grad = g.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, "#fdf3d8");
  grad.addColorStop(0.45, "#cfeaf0");
  grad.addColorStop(0.8, "#bfe3d6");
  grad.addColorStop(1, "#a9d3c2");
  g.fillStyle = grad;
  g.fillRect(0, 0, w, h);

  // soft sun glow, upper-right
  const sun = g.createRadialGradient(w * 0.72, h * 0.28, 6, w * 0.72, h * 0.28, 90);
  sun.addColorStop(0, "rgba(255,250,230,0.95)");
  sun.addColorStop(1, "rgba(255,250,230,0)");
  g.fillStyle = sun;
  g.fillRect(0, 0, w, h);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  cache.set(key, tex);
  return tex;
}

/** Ceramic tile: grout grid with per-tile tonal variation and a soft sheen. */
export function tileTexture(base: string, grout = "#b9c0bd", repeat = 3): THREE.Texture | null {
  if (typeof document === "undefined") return null;
  const key = `tile:${base}:${grout}:${repeat}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const g = canvas.getContext("2d");
  if (!g) return null;
  const [r, gr, b] = hexToRgb(base);
  const [gr0, gg0, gb0] = hexToRgb(grout);
  const rand = makeRng(seedFrom(key));

  g.fillStyle = rgb(gr0, gg0, gb0);
  g.fillRect(0, 0, size, size);

  const tiles = 4;
  const tw = size / tiles;
  const gap = 5;
  for (let ty = 0; ty < tiles; ty++) {
    for (let tx = 0; tx < tiles; tx++) {
      const tone = (rand() - 0.5) * 14;
      const x = tx * tw + gap / 2;
      const y = ty * tw + gap / 2;
      const w = tw - gap;
      g.fillStyle = rgb(r + tone, gr + tone, b + tone);
      g.fillRect(x, y, w, w);
      // top-left sheen
      const grad = g.createLinearGradient(x, y, x + w, y + w);
      grad.addColorStop(0, rgb(255, 255, 255, 0.14));
      grad.addColorStop(0.4, rgb(255, 255, 255, 0));
      g.fillStyle = grad;
      g.fillRect(x, y, w, w);
    }
  }

  return finish(canvas, key, repeat);
}
