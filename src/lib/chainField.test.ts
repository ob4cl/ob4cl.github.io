import { describe, expect, it } from 'vitest';

import {
  CHAIN_FIELD,
  easeToward,
  FIELD_LIMITS,
  GLYPH_CLASSES,
  glyphClass,
  glyphDisplacement,
  glyphHome,
  isDisplaced,
  NO_DISPLACEMENT,
  toArtworkSpace,
  travelRate,
  type ClassTraits,
  type FieldConfig,
  type GlyphClass,
  type GlyphHome
} from './chainField';

const CONFIG: FieldConfig = { reach: 150, push: 26, scatter: 13, spin: 34, shrink: 0.2, curl: 0.5 };

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

/** A glyph with no personality: straight away from the cursor, average weight and speed. */
const HOME: GlyphHome = {
  x: 200,
  y: 150,
  debrisX: 0,
  debrisY: 0,
  debrisSpin: 0,
  angle: 0,
  sense: 1,
  rate: 0.2,
  gain: 1,
  tumble: 1,
  curl: 0,
  depth: 1
};

const withTraits = (overrides: Partial<GlyphHome>): GlyphHome => ({ ...HOME, ...overrides });

/** A deterministic stand-in for Math.random, so the jitter can be tested. Lehmer, 32-bit safe. */
const seeded = (seed: number) => {
  let state = seed;
  return () => {
    state = (state * 48271) % 2147483647;
    return state / 2147483647;
  };
};

const CHARACTER: Record<GlyphClass, string> = { digit: '5', upper: 'H', lower: 'h', symbol: '#' };

/** A class's roll of the dice: the same random sequence for every class, so only the class differs. */
const sample = (kind: GlyphClass, count = 200): GlyphHome[] => {
  const random = seeded(20261010);
  return Array.from({ length: count }, () => glyphHome(CHARACTER[kind], 0, 0, random));
};

const mean = (values: number[]): number => values.reduce((total, value) => total + value, 0) / values.length;
const meanOf = (homes: GlyphHome[], pick: (home: GlyphHome) => number): number =>
  mean(homes.map(pick));

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

describe('glyphClass', () => {
  it('reads digits, capitals, lowercase letters and symbols apart', () => {
    expect(glyphClass('0')).toBe('digit');
    expect(glyphClass('7')).toBe('digit');
    expect(glyphClass('H')).toBe('upper');
    expect(glyphClass('B')).toBe('upper');
    expect(glyphClass('h')).toBe('lower');
    expect(glyphClass('r')).toBe('lower');
    expect(glyphClass('#')).toBe('symbol');
    expect(glyphClass('@')).toBe('symbol');
    expect(glyphClass(';')).toBe('symbol');
    expect(glyphClass('&')).toBe('symbol');
  });
});

describe('glyphHome', () => {
  it('rolls each glyph its own personality, so no two characters move alike', () => {
    const random = seeded(7);
    const homes = Array.from({ length: 60 }, () => glyphHome('5', 0, 0, random));
    expect(new Set(homes.map((home) => home.sense)).size).toBe(60);
    expect(new Set(homes.map((home) => home.angle)).size).toBe(60);
    expect(new Set(homes.map((home) => [home.debrisX, home.debrisY, home.debrisSpin].join(','))).size).toBe(60);
  });

  it('gives a character its class register', () => {
    // Same seed, so every differing trait comes from the class alone.
    const digit = glyphHome('5', 0, 0, seeded(1));
    const upper = glyphHome('H', 0, 0, seeded(1));
    const lower = glyphHome('h', 0, 0, seeded(1));
    const symbol = glyphHome('#', 0, 0, seeded(1));

    expect(digit.sense).toBeGreaterThan(upper.sense);
    expect(symbol.sense).toBeGreaterThan(lower.sense);
    expect(lower.sense).toBeGreaterThan(upper.sense);
    expect(upper.gain).toBeGreaterThan(lower.gain);
    expect(lower.gain).toBeGreaterThan(digit.gain);
    expect(upper.gain).toBeGreaterThan(symbol.gain);
    expect(symbol.tumble).toBeGreaterThan(lower.tumble);
    expect(lower.tumble).toBeGreaterThan(upper.tumble);
    expect(symbol.rate).toBeGreaterThan(upper.rate);
    expect(symbol.depth).toBeGreaterThan(lower.depth);
    expect(lower.depth).toBeGreaterThan(upper.depth);
    expect(Math.abs(symbol.angle)).toBeGreaterThan(Math.abs(lower.angle));
    expect(Math.abs(lower.angle)).toBeGreaterThan(Math.abs(upper.angle));
    // Anything that is not a letter or a digit lands in the symbol register.
    expect(glyphHome(';', 0, 0, seeded(1)).depth).toBe(symbol.depth);
  });
});

describe('the four registers', () => {
  it('rolls each class inside its own ranges, with a real spread on every trait', () => {
    for (const kind of Object.keys(GLYPH_CLASSES) as GlyphClass[]) {
      const traits: ClassTraits = GLYPH_CLASSES[kind];
      const homes = sample(kind);
      const sense = homes.map((home) => home.sense);
      const gain = homes.map((home) => home.gain);
      const tumble = homes.map((home) => home.tumble);
      const rate = homes.map((home) => home.rate);
      const curl = homes.map((home) => home.curl);
      const depth = homes.map((home) => home.depth);

      expect(Math.min(...sense)).toBeGreaterThanOrEqual(traits.sense[0]);
      expect(Math.max(...sense)).toBeLessThanOrEqual(traits.sense[1]);
      expect(Math.min(...gain)).toBeGreaterThanOrEqual(traits.gain[0]);
      expect(Math.max(...gain)).toBeLessThanOrEqual(traits.gain[1]);
      expect(Math.min(...tumble)).toBeGreaterThanOrEqual(traits.tumble[0]);
      expect(Math.max(...tumble)).toBeLessThanOrEqual(traits.tumble[1]);
      expect(Math.min(...rate)).toBeGreaterThanOrEqual(traits.rate[0]);
      expect(Math.max(...rate)).toBeLessThanOrEqual(traits.rate[1]);
      expect(Math.min(...curl)).toBeGreaterThanOrEqual(traits.curl[0]);
      expect(Math.max(...curl)).toBeLessThanOrEqual(traits.curl[1]);
      expect(Math.min(...depth)).toBeGreaterThanOrEqual(traits.depth[0]);
      expect(Math.max(...depth)).toBeLessThanOrEqual(traits.depth[1]);
      expect(Math.max(...homes.map((home) => Math.abs(home.angle)))).toBeLessThanOrEqual(traits.angle);
      // A range, not a constant: two glyphs of the same class never move in lockstep.
      expect(Math.max(...rate) - Math.min(...rate)).toBeGreaterThan(0.05);
      expect(Math.max(...sense) - Math.min(...sense)).toBeGreaterThan(0.1);
    }
  });

  it('separates the registers: symbols are the flightiest, capitals the heaviest', () => {
    const digits = sample('digit');
    const uppers = sample('upper');
    const lowers = sample('lower');
    const symbols = sample('symbol');

    // Sensitivity: digits and symbols feel the cursor from further out than capitals.
    expect(meanOf(symbols, (home) => home.sense)).toBeGreaterThan(meanOf(uppers, (home) => home.sense));
    expect(meanOf(digits, (home) => home.sense)).toBeGreaterThan(meanOf(uppers, (home) => home.sense));
    expect(meanOf(lowers, (home) => home.sense)).toBeGreaterThan(meanOf(uppers, (home) => home.sense));
    // Weight: capitals travel furthest, symbols least.
    expect(meanOf(uppers, (home) => home.gain)).toBeGreaterThan(meanOf(lowers, (home) => home.gain));
    expect(meanOf(lowers, (home) => home.gain)).toBeGreaterThan(meanOf(digits, (home) => home.gain));
    expect(meanOf(digits, (home) => home.gain)).toBeGreaterThan(meanOf(symbols, (home) => home.gain));
    // Tumble and speed: symbols and digits are quicker and roll further than capitals.
    expect(meanOf(symbols, (home) => home.tumble)).toBeGreaterThan(meanOf(uppers, (home) => home.tumble));
    expect(meanOf(symbols, (home) => home.rate)).toBeGreaterThan(meanOf(uppers, (home) => home.rate));
    expect(meanOf(digits, (home) => home.rate)).toBeGreaterThan(meanOf(uppers, (home) => home.rate));
    // Curl and retreat: symbols arc away and shrink the most, capitals hold their shape.
    expect(meanOf(symbols, (home) => home.curl)).toBeGreaterThan(meanOf(uppers, (home) => home.curl));
    expect(meanOf(symbols, (home) => home.depth)).toBeGreaterThan(meanOf(uppers, (home) => home.depth));
    expect(meanOf(digits, (home) => home.tumble)).toBeGreaterThan(meanOf(uppers, (home) => home.tumble));
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
    expect(Math.abs(near.x)).toBeLessThanOrEqual(CONFIG.push * HOME.gain + CONFIG.scatter);
  });

  it('keeps the centre displacement inside the push budget, in the glyph\u2019s own direction', () => {
    const atCentre = glyphDisplacement(HOME, { x: 200, y: 150, active: true }, CONFIG);
    // At zero distance there is no radial direction left, so the glyph travels its own way —
    // bounded by the full push budget rather than by the debris alone.
    expect(Math.hypot(atCentre.x, atCentre.y)).toBeGreaterThan(0);
    expect(Math.hypot(atCentre.x, atCentre.y)).toBeLessThanOrEqual(
      CONFIG.push * HOME.gain + CONFIG.scatter
    );
  });

  it('never leaves a glyph displaced beyond its class weight', () => {
    for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 12) {
      const cursor = { x: 200 + Math.cos(angle) * 40, y: 150 + Math.sin(angle) * 40, active: true };
      const value = glyphDisplacement(HOME, cursor, CONFIG);
      expect(Math.hypot(value.x, value.y)).toBeLessThanOrEqual(
        CONFIG.push * HOME.gain + CONFIG.scatter + 0.001
      );
      expect(Math.abs(value.rotation)).toBeLessThanOrEqual(CONFIG.spin * HOME.tumble + 0.001);
    }
  });

  it('shrinks the piece as it breaks, and only while it is broken', () => {
    expect(glyphDisplacement(HOME, { x: 5000, y: 5000, active: true }, CONFIG).scale).toBe(1);
    expect(glyphDisplacement(HOME, { x: 200, y: 150, active: false }, CONFIG).scale).toBe(1);

    const near = glyphDisplacement(HOME, { x: 205, y: 150, active: true }, CONFIG);
    const far = glyphDisplacement(HOME, { x: 200 + CONFIG.reach - 1, y: 150, active: true }, CONFIG);
    // Under the cursor the character is at its smallest, and it grows back as the cursor leaves.
    expect(near.scale).toBeLessThan(far.scale);
    expect(far.scale).toBeLessThan(1);
    expect(near.scale).toBeGreaterThanOrEqual(1 - CONFIG.shrink * HOME.depth);
    expect(near.scale).toBeGreaterThan(0.6);
  });

  it('holds each class inside the shrink and throw budget', () => {
    const cursor = { x: 200, y: 150, active: true };
    for (const kind of Object.keys(GLYPH_CLASSES) as GlyphClass[]) {
      for (const home of sample(kind, 40)) {
        const value = glyphDisplacement(home, cursor, CONFIG);
        expect(Math.hypot(value.x, value.y)).toBeLessThanOrEqual(
          CONFIG.push * FIELD_LIMITS.gainMax + CONFIG.scatter + 0.001
        );
        expect(Math.abs(value.rotation)).toBeLessThanOrEqual(
          CONFIG.spin * FIELD_LIMITS.tumbleMax + 0.001
        );
        expect(value.scale).toBeGreaterThanOrEqual(1 - CONFIG.shrink * FIELD_LIMITS.depthMax);
        expect(value.scale).toBeLessThanOrEqual(1);
      }
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

  it('curves the path the harder the glyph is thrown, so nothing leaves on rails', () => {
    const cursor = { x: 205, y: 150, active: true };
    const straight = glyphDisplacement(withTraits({ curl: 0 }), cursor, CONFIG);
    const curled = glyphDisplacement(withTraits({ curl: 1.2 }), cursor, CONFIG);

    expect(straight.y).toBeCloseTo(0, 5);
    // The curl bends the same throw off its straight line, without changing its length much.
    expect(Math.abs(curled.y)).toBeGreaterThan(1);
    expect(Math.hypot(curled.x, curled.y)).toBeCloseTo(Math.hypot(straight.x, straight.y), 5);
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
    const target = { x: 20, y: -10, rotation: 30, scale: 0.84 };
    let current = NO_DISPLACEMENT;
    for (let step = 0; step < 200; step++) {
      current = easeToward(current, target, 0.24);
    }
    expect(current).toEqual(target);
  });

  it('snaps to rest so the loop can stop', () => {
    const target = NO_DISPLACEMENT;
    let current = { x: 0.02, y: -0.01, rotation: 0.02, scale: 0.999 };
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
    // Even the heaviest class, fully thrown, stays inside the old shove budget.
    expect(CHAIN_FIELD.push * FIELD_LIMITS.gainMax + CHAIN_FIELD.scatter).toBeLessThanOrEqual(32);
  });

  it('shrinks the pieces, so breaking apart makes the ring smaller rather than wider', () => {
    expect(CHAIN_FIELD.shrink).toBeGreaterThan(0.05);
    expect(CHAIN_FIELD.shrink).toBeLessThanOrEqual(0.3);
    // Worst case (a symbol at the centre of the fracture) still leaves a legible character.
    expect(1 - CHAIN_FIELD.shrink * FIELD_LIMITS.depthMax).toBeGreaterThan(0.7);
    // And the curl is a bend, not a spin.
    expect(CHAIN_FIELD.curl).toBeGreaterThan(0);
    expect(CHAIN_FIELD.curl).toBeLessThan(1.6);
  });

  it('gives the classes a real spread of direction, sensitivity and speed', () => {
    const traits = Object.values(GLYPH_CLASSES);
    const senseMin = Math.min(...traits.map((entry) => entry.sense[0]));
    const senseMax = FIELD_LIMITS.senseMax;
    const rateMin = Math.min(...traits.map((entry) => entry.rate[0]));
    const rateMax = Math.max(...traits.map((entry) => entry.rate[1]));
    const angleMax = Math.max(...traits.map((entry) => entry.angle));

    expect(angleMax).toBeGreaterThan(0.2);
    expect(senseMin).toBeLessThan(1);
    expect(senseMax / senseMin).toBeGreaterThan(1.5);
    expect(rateMax / rateMin).toBeGreaterThan(2);
  });
});

describe('isDisplaced', () => {
  it('reports any residual offset, including a piece still shrunk', () => {
    expect(isDisplaced(NO_DISPLACEMENT)).toBe(false);
    expect(isDisplaced({ x: 0, y: 0, rotation: 0.5, scale: 1 })).toBe(true);
    expect(isDisplaced({ x: 0, y: 0, rotation: 0, scale: 0.98 })).toBe(true);
  });
});
