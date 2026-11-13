import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { accentFillHex, accents, accentTextHex, contrast } from './accents';

const themeFile = (name: 'light' | 'dark') => readFileSync(`src/themes/${name}.css`, 'utf8');
const variable = (css: string, name: string) =>
  css.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`))![1];

describe('accent contrast', () => {
  it('white reaches 4.5:1 on the fill of all nine accents', () => {
    for (const accent of accents) {
      const ratio = contrast('#ffffff', accentFillHex(accent.id));
      expect(ratio, `${accent.name} is ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('the fill darkens each accent only as far as white needs', () => {
    const expected = {
      blue: '#2576d5',
      teal: '#008296',
      green: '#2a863d',
      yellow: '#a66800',
      orange: '#d44300',
      red: '#e2283f',
      pink: '#bf4d85',
      purple: '#9141ac',
      slate: '#65798b',
    } as const;
    const channels = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
    for (const accent of accents) {
      const got = channels(accentFillHex(accent.id));
      const want = channels(expected[accent.id]);
      got.forEach((value, i) =>
        expect(Math.abs(value - want[i]), `${accent.name} is ${accentFillHex(accent.id)}`).toBeLessThanOrEqual(1),
      );
    }
  });

  it('accent text reaches 4.5:1 on the background and cards in both themes', () => {
    for (const theme of ['light', 'dark'] as const) {
      const css = themeFile(theme);
      for (const accent of accents) {
        const text = accentTextHex(accent.id, theme === 'dark');
        for (const surface of ['background', 'card']) {
          const ratio = contrast(text, variable(css, surface));
          expect(ratio, `${accent.name} on ${theme} ${surface} is ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(4.5);
        }
      }
    }
  });

  it('body and muted text reach 4.5:1 in both themes', () => {
    for (const theme of ['light', 'dark'] as const) {
      const css = themeFile(theme);
      for (const text of ['foreground', 'muted-foreground']) {
        for (const surface of ['background', 'card']) {
          const ratio = contrast(variable(css, text), variable(css, surface));
          expect(ratio, `${text} on ${theme} ${surface} is ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(4.5);
        }
      }
    }
  });
});
