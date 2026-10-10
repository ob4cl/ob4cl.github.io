import { describe, expect, it } from 'vitest';

import {
  CHAIN_FIELD,
  easeToward,
  GLYPH_TRAITS,
  glyphDisplacement,
  isDisplaced,
  NO_DISPLACEMENT,
  toArtworkSpace,
  travelRate,
  type FieldConfig,
  type GlyphHome
} from './chainField';

const CONFIG: FieldConfig = { reach: 150, push: 26, scatter: 13, spin: 34 };

/** The artwork as it sits on the page: 400×300 layout pixels, centred at (300, 200), no rotation. */
const FRAME = {
  left: 100,
  top: 50,
  width: 400,
  height: 300,
  layoutWidth: 400,
  layoutHeight: 300,
  cos: 1,
  sin: 0
};

/** A glyph with no personality: straight away from the cursor, average sensitivity and speed. */
const HOME: GlyphHome = {
  x: 200,
  y: 150,
  debrisX: 0,
  debrisY: 0,
  debrisSpin: 0,
  angle: 0,
  sense: 1,
  rate: 0.2
};

const withTraits = (overrides: Partial<GlyphHome>): GlyphHome => ({ ...HOME, ...overrides });

describe('toArtworkSpace', () => {
  it('maps the artwork centre to its own centre', () => {
    const point = toArtworkSpace({ clientX: 300, clientY: 200 }, FRAME);
    expect(point.x).toBeCloseTo(200);
    expect(point.y).toBeCloseTo(150);
  });

  it('undoes the artwork rotation', () => {
    // Same box, rotated by -13deg: the matrix components of rotate(-13deg).
    const angle = (-13 * Math.PI) / 180;
    const rotated = { ...FRAME, cos: Math.cos(angle), sin: Math.sin(angle) };
    // A pointer 100px right of centre in *screen* space maps back onto the rotated axis.
    const point = toArtworkSpace({ clientX: 400, clientY: 200 }, rotated);
    expect(point.x).toBeCloseTo(200 + 100 * Math.cos(angle));
    expect(point.y).toBeCloseTo(150 - 100 * Math.sin(angle));
  });
});

describe('glyphDisplacement', () => {
  it('leaves glyphs alone when the pointer is away', () => {
    expect(glyphDisplacement(HOME, { x: 0, y: 0, active: false }, CONFIG)).toEqual(NO_DISPLACEMENT);
    expect(glyphDisplacement(HOME, { x: 2000, y: 2000, active: true }, CONFIG)).toEqual(
      NO_DISPLACEMENT
    );
  });

  it('pushes glyphs away from the cursor and decays with distance', () => {
    const near = glyphDisplacement(HOME, { x: 210, y: 150, active: true }, CONFIG);
    const far = glyphDisplacement(HOME, { x: 260, y: 150, active: true }, CONFIG);

    // The cursor is to the right of the glyph, so the glyph is thrown to the left.
    expect(near.x).toBeLessThan(0);
    expect(near.y).toBeCloseTo(0);
    expect(Math.abs(near.x)).toBeGreaterThan(Math.abs(far.x));
    expect(Math.abs(near.x)).toBeLessThanOrEqual(CONFIG.push + CONFIG.scatter);
  });

  it('keeps the centre displacement inside the push budget, in the glyph\u2019s own direction', () => {
    const atCentre = glyphDisplacement(HOME, { x: 200, y: 150, active: true }, CONFIG);
    // At zero distance there is no radial direction left, so the glyph travels its own way —
    // bounded by the full push budget rather than by the debris alone.
    expect(Math.hypot(atCentre.x, atCentre.y)).toBeGreaterThan(0);
    expect(Math.hypot(atCentre.x, atCentre.y)).toBeLessThanOrEqual(CONFIG.push + CONFIG.scatter);
  });

  it('never leaves a glyph displaced beyond push + scatter + spin from home', () => {
    for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 12) {
      const cursor = { x: 200 + Math.cos(angle) * 40, y: 150 + Math.sin(angle) * 40, active: true };
      const value = glyphDisplacement(HOME, cursor, CONFIG);
      expect(Math.hypot(value.x, value.y)).toBeLessThanOrEqual(CONFIG.push + CONFIG.scatter + 0.001);
      expect(Math.abs(value.rotation)).toBeLessThanOrEqual(CONFIG.spin + 0.001);
    }
  });

  it('gives each glyph its own direction, so neighbours scatter apart', () => {
    // Cursor to the right of the glyph: straight back means a negative x, nothing on y.
    const cursor = { x: 210, y: 150, active: true };
    const straight = glyphDisplacement(withTraits({ angle: 0 }), cursor, CONFIG);
    const turned = glyphDisplacement(withTraits({ angle: 0.5 }), cursor, CONFIG);
    const turnedOther = glyphDisplacement(withTraits({ angle: -0.5 }), cursor, CONFIG);

    expect(straight.x).toBeLessThan(0);
    expect(straight.y).toBeCloseTo(0, 5);
    // Turning the direction splits the pair either side of that line.
    expect(turned.y).not.toBeCloseTo(0, 1);
    expect(Math.sign(turned.y)).not.toBe(Math.sign(turnedOther.y));
    expect(Math.abs(turned.y - turnedOther.y)).toBeGreaterThan(2);
  });

  it('lets sensitive glyphs feel the cursor from further away', () => {
    const cursor = { x: 200 + 130, y: 150, active: true };
    const nearSighted = glyphDisplacement(withTraits({ sense: 0.72 }), cursor, CONFIG);
    const farSighted = glyphDisplacement(withTraits({ sense: 1.32 }), cursor, CONFIG);

    expect(nearSighted).toEqual(NO_DISPLACEMENT);
    expect(Math.hypot(farSighted.x, farSighted.y)).toBeGreaterThan(0);
  });
});

describe('easeToward', () => {
  it('moves toward the target without overshooting', () => {
    const target = { x: 20, y: -10, rotation: 30 };
    let current = NO_DISPLACEMENT;
    for (let step = 0; step < 200; step++) {
      current = easeToward(current, target, 0.24);
    }
    expect(current).toEqual(target);
  });

  it('snaps to zero so the loop can stop', () => {
    const target = NO_DISPLACEMENT;
    let current = { x: 0.02, y: -0.01, rotation: 0.02 };
    current = easeToward(current, target, 0.12);
    expect(current).toEqual(NO_DISPLACEMENT);
    expect(isDisplaced(current)).toBe(false);
  });
});

describe('travelRate', () => {
  it('uses the glyph\u2019s own speed outwards and a slower one on the way home', () => {
    expect(travelRate(HOME, true)).toBe(HOME.rate);
    expect(travelRate(HOME, false)).toBeCloseTo(HOME.rate * 0.6);
  });
});

describe('the shipped chain field', () => {
  it('stays restrained: a fray, not a shatter', () => {
    // Regression guard: push 32 with 16 of debris read as one big shove rather than a scatter.
    expect(CHAIN_FIELD.push + CHAIN_FIELD.scatter).toBeLessThanOrEqual(32);
    expect(CHAIN_FIELD.reach).toBeLessThanOrEqual(150);
    expect(CHAIN_FIELD.spin).toBeLessThanOrEqual(45);
  });

  it('gives the glyphs a real spread of direction, sensitivity and speed', () => {
    expect(GLYPH_TRAITS.angle).toBeGreaterThan(0.2);
    expect(GLYPH_TRAITS.senseMin).toBeLessThan(1);
    expect(GLYPH_TRAITS.senseMax / GLYPH_TRAITS.senseMin).toBeGreaterThan(1.5);
    expect(GLYPH_TRAITS.rateMax / GLYPH_TRAITS.rateMin).toBeGreaterThan(2);
  });
});

describe('isDisplaced', () => {
  it('reports any residual offset', () => {
    expect(isDisplaced(NO_DISPLACEMENT)).toBe(false);
    expect(isDisplaced({ x: 0, y: 0, rotation: 0.5 })).toBe(true);
  });
});
