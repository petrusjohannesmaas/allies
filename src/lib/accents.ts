// The libadwaita accent palette, in the order the Appearance page shows it.
export const accents = [
  { id: 'blue', name: 'Blue', hex: '#3584e4' },
  { id: 'teal', name: 'Teal', hex: '#2190a4' },
  { id: 'green', name: 'Green', hex: '#3a944a' },
  { id: 'yellow', name: 'Yellow', hex: '#c88800' },
  { id: 'orange', name: 'Orange', hex: '#ed5b00' },
  { id: 'red', name: 'Red', hex: '#e62d42' },
  { id: 'pink', name: 'Pink', hex: '#d56199' },
  { id: 'purple', name: 'Purple', hex: '#9141ac' },
  { id: 'slate', name: 'Slate', hex: '#6f8396' },
] as const;

export type AccentId = (typeof accents)[number]['id'];

export const DEFAULT_ACCENT: AccentId = 'blue';

export function isAccentId(value: unknown): value is AccentId {
  return accents.some((accent) => accent.id === value);
}

export function accentHex(id: AccentId): string {
  return accents.find((accent) => accent.id === id)!.hex;
}

type Rgb = [number, number, number];
type Oklab = [number, number, number];

function hexToRgb(hex: string): Rgb {
  return [1, 3, 5].map((index) => parseInt(hex.slice(index, index + 2), 16) / 255) as Rgb;
}

function rgbToHex([red, green, blue]: Rgb): string {
  const channel = (value: number) =>
    Math.round(Math.min(1, Math.max(0, value)) * 255)
      .toString(16)
      .padStart(2, '0');
  return `#${channel(red)}${channel(green)}${channel(blue)}`;
}

function toLinear(value: number): number {
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

function fromLinear(value: number): number {
  return value <= 0.0031308 ? 12.92 * value : 1.055 * value ** (1 / 2.4) - 0.055;
}

function rgbToOklab(rgb: Rgb): Oklab {
  const [r, g, b] = rgb.map(toLinear) as Rgb;
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

function oklabToRgb([lightness, a, b]: Oklab): Rgb {
  const l = (lightness + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (lightness - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (lightness - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const rgb: Rgb = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
  return rgb.map(fromLinear) as Rgb;
}

/// The accent as text on the page. Light themes take it darker and dark themes
/// lighter, so the text stays readable without changing the accent itself.
export function accentTextHex(id: AccentId, darkTheme = true): string {
  const [lightness, a, b] = rgbToOklab(hexToRgb(accentHex(id)));
  return rgbToHex(oklabToRgb([darkTheme ? Math.max(lightness, 0.85) : Math.min(lightness, 0.5), a, b]));
}

/// The accent as a button fill. Lowers its OKLab lightness in steps of 0.005
/// until white text reaches 4.5:1, and keeps the accent when white already does.
export function accentFillHex(id: AccentId): string {
  const hex = accentHex(id);
  if (contrast('#ffffff', hex) >= 4.5) return hex;
  const [lightness, a, b] = rgbToOklab(hexToRgb(hex));
  for (let level = lightness - 0.005; level > 0; level -= 0.005) {
    const candidate = rgbToHex(oklabToRgb([level, a, b]));
    if (contrast('#ffffff', candidate) >= 4.5) return candidate;
  }
  return '#000000';
}

/// The relative luminance of a colour.
function luminance(hex: string): number {
  const [red, green, blue] = hexToRgb(hex).map(toLinear) as Rgb;
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

/// The WCAG contrast ratio between two colours.
export function contrast(a: string, b: string): number {
  const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (high + 0.05) / (low + 0.05);
}
