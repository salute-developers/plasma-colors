import {
  differenceEuclidean,
  parseHex as culoriParseHex,
} from 'culori'

export type DistanceMode = 'rgb' | 'oklch'

export interface RGB {
  r: number;
  g: number;
  b: number;
  a?: number;
}

/** Parse hex (#RGB, #RRGGBB, #RRGGBBAA) to RGB. */
export function parseHex(hex: string): RGB | null {
  const cleaned = hex.replace(/^#/, '').trim();
  if (!/^[0-9A-Fa-f]{3,8}$/.test(cleaned)) return null;
  let r: number, g: number, b: number, a = 1;
  if (cleaned.length === 3) {
    r = parseInt(cleaned[0] + cleaned[0], 16);
    g = parseInt(cleaned[1] + cleaned[1], 16);
    b = parseInt(cleaned[2] + cleaned[2], 16);
  } else if (cleaned.length === 6) {
    r = parseInt(cleaned.slice(0, 2), 16);
    g = parseInt(cleaned.slice(2, 4), 16);
    b = parseInt(cleaned.slice(4, 6), 16);
  } else if (cleaned.length === 8) {
    r = parseInt(cleaned.slice(0, 2), 16);
    g = parseInt(cleaned.slice(2, 4), 16);
    b = parseInt(cleaned.slice(4, 6), 16);
    a = parseInt(cleaned.slice(6, 8), 16) / 255;
  } else {
    return null;
  }
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return null;
  return { r, g, b, a };
}

/** Parse rgba(r,g,b) or rgba(r,g,b,a) or rgb(r,g,b). */
export function parseRgba(str: string): RGB | null {
  const match = str.trim().match(
    /^rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)\s*$/
  );
  if (!match) return null;
  const r = Math.min(255, Math.max(0, parseInt(match[1], 10)));
  const g = Math.min(255, Math.max(0, parseInt(match[2], 10)));
  const b = Math.min(255, Math.max(0, parseInt(match[3], 10)));
  const a = match[4] != null ? parseFloat(match[4]) : 1;
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return null;
  return { r, g, b, a };
}

/** Parse computed rgb/rgba string (e.g. "rgb(255, 0, 255)" or "rgb(255 0 255)"). */
function parseRgbComputed(str: string): RGB | null {
  const match = str.trim().match(
    /^rgba?\s*\(\s*([\d.]+)\s*[,]\s*([\d.]+)\s*[,]\s*([\d.]+)\s*(?:[,/]\s*([\d.]+)\s*)?\)\s*$/i
  );
  if (match) {
    const r = Math.min(255, Math.max(0, Math.round(parseFloat(match[1]))));
    const g = Math.min(255, Math.max(0, Math.round(parseFloat(match[2]))));
    const b = Math.min(255, Math.max(0, Math.round(parseFloat(match[3]))));
    const a = match[4] != null ? parseFloat(match[4]) : 1;
    if (!Number.isNaN(r) && !Number.isNaN(g) && !Number.isNaN(b)) return { r, g, b, a };
  }
  const spaceMatch = str.trim().match(
    /^rgba?\s*\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*(?:\/\s*([\d.]+)\s*)?\)\s*$/i
  );
  if (spaceMatch) {
    const r = Math.min(255, Math.max(0, Math.round(parseFloat(spaceMatch[1]))));
    const g = Math.min(255, Math.max(0, Math.round(parseFloat(spaceMatch[2]))));
    const b = Math.min(255, Math.max(0, Math.round(parseFloat(spaceMatch[3]))));
    const a = spaceMatch[4] != null ? parseFloat(spaceMatch[4]) : 1;
    if (!Number.isNaN(r) && !Number.isNaN(g) && !Number.isNaN(b)) return { r, g, b, a };
  }
  return null;
}

/** Resolve a CSS color name (e.g. "magenta", "rebeccapurple") via the browser. */
function parseCssColorName(name: string): RGB | null {
  if (typeof document === 'undefined') return null;
  const el = document.createElement('div');
  el.style.color = name;
  document.body.appendChild(el);
  const computed = getComputedStyle(el).color;
  document.body.removeChild(el);
  if (!computed || computed === 'rgba(0, 0, 0, 0)' || el.style.color === '') return null;
  return parseRgbComputed(computed);
}

/** Try to parse any supported color string (hex, rgba, or CSS color name). */
export function parseColor(input: string): RGB | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith('#')) return parseHex(trimmed);
  if (/^rgba?\s*\(/i.test(trimmed)) return parseRgba(trimmed);
  return parseCssColorName(trimmed);
}

/** Euclidean distance in RGB (ignores alpha for matching). */
export function rgbDistance(a: RGB, b: RGB): number {
  return Math.sqrt(
    (a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2
  );
}

/** RGB to hex (#RRGGBB). */
export function rgbToHex(rgb: RGB): string {
  const r = Math.round(Math.min(255, Math.max(0, rgb.r)))
    .toString(16)
    .padStart(2, '0');
  const g = Math.round(Math.min(255, Math.max(0, rgb.g)))
    .toString(16)
    .padStart(2, '0');
  const b = Math.round(Math.min(255, Math.max(0, rgb.b)))
    .toString(16)
    .padStart(2, '0');
  return `#${r}${g}${b}`;
}

export interface PaletteEntry {
  family: string;
  shade: string;
  hex: string;
  rgb: RGB;
}

/** Build flat list of all palette entries with RGB. */
export function flattenPalette(
  palette: Record<string, Record<string, string>>
): PaletteEntry[] {
  const entries: PaletteEntry[] = [];
  for (const [family, shades] of Object.entries(palette)) {
    for (const [shade, hex] of Object.entries(shades)) {
      const rgb = parseHex(hex);
      if (rgb) entries.push({ family, shade, hex, rgb });
    }
  }
  return entries;
}

/** Convert our RGB (0–255) to culori rgb object (0–1). */
function rgbToCulori(rgb: RGB) {
  return {
    mode: 'rgb' as const,
    r: rgb.r / 255,
    g: rgb.g / 255,
    b: rgb.b / 255,
  }
}

/** Culori color from hex (for palette entries). */
function culoriFromHex(hex: string) {
  const normalized = hex.startsWith('#') ? hex : `#${hex}`
  return culoriParseHex(normalized)
}

const oklchMetric = differenceEuclidean('oklch')

/** Find N nearest palette colors to the given RGB. */
export function findNearest(
  flat: PaletteEntry[],
  target: RGB,
  n: number = 5,
  mode: DistanceMode = 'rgb'
): Array<{ entry: PaletteEntry; distance: number }> {
  if (mode === 'oklch') {
    const targetCulori = rgbToCulori(target)
    const withDistance = flat.map((entry) => {
      const entryCulori = culoriFromHex(entry.hex)
      const distance =
        entryCulori != null ? oklchMetric(targetCulori, entryCulori) : Infinity
      return { entry, distance }
    })
    withDistance.sort((a, b) => a.distance - b.distance)
    return withDistance.slice(0, n)
  }
  const withDistance = flat.map((entry) => ({
    entry,
    distance: rgbDistance(entry.rgb, target),
  }))
  withDistance.sort((a, b) => a.distance - b.distance)
  return withDistance.slice(0, n)
}
