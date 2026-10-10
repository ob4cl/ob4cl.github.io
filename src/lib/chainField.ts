/**
 * Pure geometry for the hero chain's break-apart field.
 *
 * Kept out of the component so the maths can be unit tested without a browser, and so the
 * component only has to worry about wiring it to pointer events and GSAP.
 *
 * A glyph's personality starts with what the character IS. Digits, capitals, lowercase letters and
 * symbols each break in their own register — digits are light and nervous, capitals heavy and
 * deliberate, symbols the flightiest of all — and every glyph then gets its own jitter on top, so
 * no two characters of the same kind ever move alike. Glyphs curve as they leave and shrink while
 * they are thrown, so the ring comes apart into smaller pieces instead of inflating.
 */

export type GlyphClass = 'digit' | 'upper' | 'lower' | 'symbol';

/** A closed range to roll a trait inside: `[min, max]`. */
export type Range = readonly [number, number];

export interface GlyphHome {
  /** Resting position inside the artwork, in layout pixels. */
  x: number;
  y: number;
  /** Fixed debris so no two glyphs move the same way. */
  debrisX: number;
  debrisY: number;
  debrisSpin: number;
  /** This glyph's own direction offset, in radians: it never flies straight away from the cursor. */
  angle: number;
  /** Multiplier on the field's reach — some glyphs feel the cursor from further away. */
  sense: number;
  /** This glyph's own travel rate, so nothing moves in lockstep. */
  rate: number;
  /** The glyph class's weight, as a multiplier on the field's push. */
  gain: number;
  /** How freely this glyph tumbles, as a multiplier on the field's spin. */
  tumble: number;
  /** How far this glyph bends off a straight line, as a multiplier on the field's curl. */
  curl: number;
  /** How far this glyph retreats as it breaks, as a multiplier on the field's shrink. */
  depth: number;
}

/** What each kind of character brings to the fracture. */
export interface ClassTraits {
  sense: Range;
  gain: Range;
  tumble: Range;
  rate: Range;
  /** Maximum direction offset either side of straight-away-from-the-cursor, in radians. */
  angle: number;
  curl: Range;
  depth: Range;
}

/**
 * The four registers. Every range is deliberately stretched, because the point of the effect is
 * that a digit and the capital next to it do not leave together or in the same manner.
 */
export const GLYPH_CLASSES: Record<GlyphClass, ClassTraits> = {
  // Digits: light and nervous. They notice the cursor early, drift a long way and tumble hard.
  digit: {
    sense: [1.05, 1.4],
    gain: [0.7, 0.95],
    tumble: [1.15, 1.6],
    rate: [0.17, 0.34],
    angle: 0.7,
    curl: [0.8, 1.25],
    depth: [1, 1.3]
  },
  // Capitals: the heavy links. They hold their line the longest, travel furthest, barely roll.
  upper: {
    sense: [0.6, 0.95],
    gain: [1, 1.3],
    tumble: [0.5, 0.85],
    rate: [0.08, 0.2],
    angle: 0.3,
    curl: [0.25, 0.55],
    depth: [0.7, 1]
  },
  // Lowercase letters: the middle register, between the capitals and the symbols.
  lower: {
    sense: [0.8, 1.15],
    gain: [0.85, 1.1],
    tumble: [0.8, 1.15],
    rate: [0.12, 0.26],
    angle: 0.5,
    curl: [0.5, 0.85],
    depth: [0.85, 1.15]
  },
  // Symbols: the flightiest. Wide scatter, quickest off the mark, they shrink the most.
  symbol: {
    sense: [1.1, 1.5],
    gain: [0.6, 0.9],
    tumble: [1.2, 1.7],
    rate: [0.18, 0.38],
    angle: 0.85,
    curl: [1, 1.45],
    depth: [1.1, 1.4]
  }
};

/** The widest trait any class can roll, so callers can bound what the field is allowed to do. */
export const FIELD_LIMITS = {
  senseMax: Math.max(...Object.values(GLYPH_CLASSES).map((traits) => traits.sense[1])),
  gainMax: Math.max(...Object.values(GLYPH_CLASSES).map((traits) => traits.gain[1])),
  tumbleMax: Math.max(...Object.values(GLYPH_CLASSES).map((traits) => traits.tumble[1])),
  depthMax: Math.max(...Object.values(GLYPH_CLASSES).map((traits) => traits.depth[1]))
} as const;

export interface FieldConfig {
  /** How far the cursor reaches, before each glyph's own sensitivity. */
  reach: number;
  /** How far a glyph can be thrown from its resting place, before its class weight. */
  push: number;
  /** Extra random throw at the centre of the fracture. */
  scatter: number;
  /** Rotation, in degrees, at the centre of the fracture. */
  spin: number;
  /** How much a glyph shrinks at the centre of the fracture, before its own depth. */
  shrink: number;
  /** How far a thrown glyph bends off its straight line, in radians at the fracture centre. */
  curl: number;
}

export interface ArtworkFrame {
  /** The artwork's bounding box on screen. */
  left: number;
  top: number;
  width: number;
  height: number;
  /** The artwork's own layout size, before any transform. */
  layoutWidth: number;
  layoutHeight: number;
  /** The `a` and `b` components of its computed transform matrix (its 2D rotation). */
  cos: number;
  sin: number;
}

export interface Displacement {
  x: number;
  y: number;
  rotation: number;
  /** 1 while the glyph is at rest, smaller once it has broken away. */
  scale: number;
}

export const NO_DISPLACEMENT: Displacement = { x: 0, y: 0, rotation: 0, scale: 1 };

/**
 * The field the hero chain uses. Deliberately restrained: a pixel or two of drift at the edge of
 * reach, rising to a short throw under the cursor, while the pieces shrink — so the chain frays
 * into smaller characters instead of shoving outwards.
 */
export const CHAIN_FIELD: FieldConfig = {
  reach: 130,
  push: 15,
  scatter: 9,
  spin: 30,
  shrink: 0.16,
  curl: 0.5
};

const between = (range: Range, random: () => number): number =>
  range[0] + random() * (range[1] - range[0]);

/** Which register a character breaks in. Anything that is not a letter or a digit is a symbol. */
export function glyphClass(character: string): GlyphClass {
  if (/[0-9]/.test(character)) return 'digit';
  if (/[a-z]/.test(character)) return 'lower';
  if (/[A-Z]/.test(character)) return 'upper';
  return 'symbol';
}

/**
 * Build a glyph's personality from the character it shows: class first, then jitter within that
 * class, so digits differ from letters, from symbols, and from each other.
 */
export function glyphHome(
  character: string,
  x: number,
  y: number,
  random: () => number = Math.random
): GlyphHome {
  const traits = GLYPH_CLASSES[glyphClass(character)];
  return {
    x,
    y,
    debrisX: random() * 2 - 1,
    debrisY: random() * 2 - 1,
    debrisSpin: random() * 2 - 1,
    angle: (random() * 2 - 1) * traits.angle,
    sense: between(traits.sense, random),
    gain: between(traits.gain, random),
    tumble: between(traits.tumble, random),
    rate: between(traits.rate, random),
    curl: between(traits.curl, random),
    depth: between(traits.depth, random)
  };
}

/**
 * Where the pointer sits in the artwork's own coordinate space. The artwork is rotated in CSS, so
 * the rotation is undone before any distance is measured — otherwise the field would lean with it.
 */
export function toArtworkSpace(
  pointer: { clientX: number; clientY: number },
  frame: ArtworkFrame
): { x: number; y: number } {
  const dx = pointer.clientX - (frame.left + frame.width / 2);
  const dy = pointer.clientY - (frame.top + frame.height / 2);
  return {
    x: frame.layoutWidth / 2 + (dx * frame.cos + dy * frame.sin),
    y: frame.layoutHeight / 2 + (-dx * frame.sin + dy * frame.cos)
  };
}

/** How one glyph should be displaced for a cursor at `cursor` (in artwork space). */
export function glyphDisplacement(
  home: GlyphHome,
  cursor: { x: number; y: number; active: boolean },
  config: FieldConfig
): Displacement {
  if (!cursor.active) return NO_DISPLACEMENT;

  const dx = home.x - cursor.x;
  const dy = home.y - cursor.y;
  const distance = Math.hypot(dx, dy);
  const reach = config.reach * home.sense;
  if (distance >= reach) return NO_DISPLACEMENT;

  // Softer than linear: the glyphs under the cursor move most, their neighbours barely stir.
  const falloff = Math.pow(1 - distance / reach, 1.8);

  // Radial direction, turned by the glyph's own angle so neighbours scatter apart from each other,
  // and bent further by its curl as it is thrown — pieces arc away, they do not slide on rails.
  const nx = distance > 0.01 ? dx / distance : Math.cos(home.angle);
  const ny = distance > 0.01 ? dy / distance : Math.sin(home.angle);
  const turn = home.angle + home.curl * config.curl * falloff;
  const cos = Math.cos(turn);
  const sin = Math.sin(turn);
  const rx = nx * cos - ny * sin;
  const ry = nx * sin + ny * cos;

  const thrown = config.push * home.gain * falloff;
  const dust = config.scatter * falloff;

  return {
    x: rx * thrown + home.debrisX * dust,
    y: ry * thrown + home.debrisY * dust,
    rotation: home.debrisSpin * config.spin * home.tumble * falloff,
    // And it shrinks on the way out: the ring breaks apart into smaller characters.
    scale: 1 - config.shrink * home.depth * falloff
  };
}

/** Travel rate for a glyph: its own speed on the way out, a little slower on the way home. */
export function travelRate(home: GlyphHome, active: boolean): number {
  return active ? home.rate : home.rate * 0.6;
}

/** Ease a glyph's current offset toward its target. `rate` is per frame. */
export function easeToward(current: Displacement, target: Displacement, rate: number): Displacement {
  const next = {
    x: current.x + (target.x - current.x) * rate,
    y: current.y + (target.y - current.y) * rate,
    rotation: current.rotation + (target.rotation - current.rotation) * rate,
    scale: current.scale + (target.scale - current.scale) * rate
  };
  // Snap once the difference stops being visible, so the loop can settle and stop.
  if (Math.abs(target.x - next.x) < 0.03) next.x = target.x;
  if (Math.abs(target.y - next.y) < 0.03) next.y = target.y;
  if (Math.abs(target.rotation - next.rotation) < 0.03) next.rotation = target.rotation;
  if (Math.abs(target.scale - next.scale) < 0.002) next.scale = target.scale;
  return next;
}

export function isDisplaced(value: Displacement): boolean {
  return value.x !== 0 || value.y !== 0 || value.rotation !== 0 || value.scale !== 1;
}
