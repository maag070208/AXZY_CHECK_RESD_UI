import { ITThemePalette, resolveCssColor } from "@axzydev/axzy_ui_system";

const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));

const hexToRgb = (hex: string): [number, number, number] => {
  let h = hex.replace("#", "").trim();
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const num = parseInt(h, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
};

const rgbToHex = (r: number, g: number, b: number) =>
  `#${[r, g, b].map((n) => clamp(n).toString(16).padStart(2, "0")).join("")}`;

const toLinear = (c: number) => {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
};

const luminance = (r: number, g: number, b: number) =>
  0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);

export const mix = (hex: string, withHex: string, amount: number): string => {
  const [r1, g1, b1] = hexToRgb(hex);
  const [r2, g2, b2] = hexToRgb(withHex);
  const a = Math.max(0, Math.min(1, amount));
  return rgbToHex(r1 * (1 - a) + r2 * a, g1 * (1 - a) + g2 * a, b1 * (1 - a) + b2 * a);
};

export const lighten = (hex: string, amount: number) => mix(hex, "#ffffff", amount);
export const darken = (hex: string, amount: number) => mix(hex, "#000000", amount);

export const buildShades = (hex: string) => {
  const base = resolveCssColor(hex);
  const lum = luminance(...hexToRgb(base));
  const isLight = lum > 0.5;
  const lightenAmt = isLight ? 0.9 : 0.85;
  const soft = isLight ? lighten(base, 0.45) : lighten(base, 0.32);
  return {
    50: isLight ? lighten(base, lightenAmt) : lighten(base, 0.55),
    100: soft,
    200: isLight ? lighten(base, 0.7) : lighten(base, 0.42),
    300: isLight ? lighten(base, 0.5) : lighten(base, 0.3),
    400: isLight ? lighten(base, 0.3) : lighten(base, 0.18),
    500: base,
    600: isLight ? darken(base, 0.12) : lighten(base, 0.08),
    700: isLight ? darken(base, 0.25) : darken(base, 0.1),
    800: isLight ? darken(base, 0.4) : darken(base, 0.25),
    900: isLight ? darken(base, 0.55) : darken(base, 0.4),
  };
};

export type ThemeColor = keyof Pick<
  ITThemePalette,
  "primary" | "secondary" | "danger" | "success" | "warning" | "info" | "ternary" | "alert"
>;

export const colorHex = (palette: ITThemePalette, key: ThemeColor) =>
  resolveCssColor(palette[key]);
