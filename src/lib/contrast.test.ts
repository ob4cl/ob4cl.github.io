import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Contrast check on the real token file.
 *
 * Parses `src/styles/tokens.css` so the assertions cannot drift away from what actually ships,
 * then applies the WCAG 2.1 relative-luminance formula.
 */

const TOKENS_PATH = join(process.cwd(), 'src', 'styles', 'tokens.css');
const tokensCss = readFileSync(TOKENS_PATH, 'utf8');

function token(name: string): string {
  const match = tokensCss.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`));
  if (!match) throw new Error(`token --${name} not found in tokens.css`);
  return match[1].toLowerCase();
}

function channel(value: number): number {
  const c = value / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function contrast(a: string, b: string): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}

describe('palette contrast on the ink background', () => {
  const ink = token('ink');

  it('parses hex tokens from tokens.css', () => {
    expect(ink).toMatch(/^#[0-9a-f]{6}$/);
    expect(token('acid')).toMatch(/^#[0-9a-f]{6}$/);
  });

  it.each([
    ['paper', 7],
    ['paper-dim', 7],
    ['muted', 4.5],
    ['acid', 7],
    ['sev-critical', 4.5],
    ['sev-high', 4.5],
    ['sev-medium', 4.5],
    ['sev-low', 4.5],
    ['sev-info', 4.5]
  ])('%s on ink meets WCAG AA (at least %s:1)', (name, minimum) => {
    const ratio = contrast(token(name), ink);
    expect(ratio, `${name} on ink = ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(minimum as number);
  });

  it('ink on the acid accent meets AAA for button text', () => {
    expect(contrast(token('ink-on-acid'), token('acid'))).toBeGreaterThanOrEqual(7);
  });

  it('keeps a clear separation between the two surfaces and the ink', () => {
    expect(contrast(token('ink-2'), ink)).toBeLessThan(2);
  });
});
