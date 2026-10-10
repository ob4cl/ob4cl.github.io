/**
 * Pure geometry for the hero chain's break-apart field.
 *
 * Kept out of the component so the maths can be unit tested without a browser, and so the
 * component only has to worry about wiring it to pointer events and GSAP.
 *
 * Every glyph carries its own personality — direction, sensitivity and travel speed — so passing
 * the cursor over the chain frays it glyph by glyph instead of shoving it about in one piece.
 */

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
}

export interface FieldConfig {
  /** How far the cursor reaches, before each glyph's own sensitivity. */
  reach: number;
  /** How far a glyph can be thrown from its resting place. */
  push: number;
  /** Extra random throw at the centre of the fracture. */
  scatter: number;
  /** Rotation, in degrees, at the centre of the fracture. */
  spin: number;
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
}

export const NO_DISPLACEMENT: Displacement = { x: 0, y: 0, rotation: 0 };

/**
 * The field the hero chain uses. Deliberately restrained: a pixel or two of drift at the edge of
 * reach, rising to a short throw under the cursor, so the chain frays rather than shatters.
 */
export const CHAIN_FIELD: FieldConfig = { reach: 135, push: 18, scatter: 12, spin: 38 };

/** Ranges used when giving each glyph its personality (see `GlyphHome`). */
export const GLYPH_TRAITS = {
  /** Maximum direction offset either side of straight-away-from-the-cursor, in radians. */
  angle: 0.55,
  senseMin: 0.72,
  senseMax: 1.32,
  rateMin: 0.1,
  rateMax: 0.28
} as const;

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

  // Radial direction, turned by the glyph's own angle so neighbours scatter apart from each other.
  const nx = distance > 0.01 ? dx / distance : Math.cos(home.angle);
  const ny = distance > 0.01 ? dy / distance : Math.sin(home.angle);
  const cos = Math.cos(home.angle);
  const sin = Math.sin(home.angle);
  const rx = nx * cos - ny * sin;
  const ry = nx * sin + ny * cos;

  return {
    x: rx * config.push * falloff + home.debrisX * config.scatter * falloff,
    y: ry * config.push * falloff + home.debrisY * config.scatter * falloff,
    rotation: home.debrisSpin * config.spin * falloff
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
    rotation: current.rotation + (target.rotation - current.rotation) * rate
  };
  // Snap once the difference stops being visible, so the loop can settle and stop.
  if (Math.abs(target.x - next.x) < 0.03) next.x = target.x;
  if (Math.abs(target.y - next.y) < 0.03) next.y = target.y;
  if (Math.abs(target.rotation - next.rotation) < 0.03) next.rotation = target.rotation;
  return next;
}

export function isDisplaced(value: Displacement): boolean {
  return value.x !== 0 || value.y !== 0 || value.rotation !== 0;
}
