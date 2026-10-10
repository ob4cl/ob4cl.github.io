/**
 * Pure geometry for the hero chain's break-apart field.
 *
 * Kept out of the component so the maths can be unit tested without a browser, and so the
 * component only has to worry about wiring it to pointer events and GSAP.
 */

export interface GlyphHome {
  /** Resting position inside the artwork, in layout pixels. */
  x: number;
  y: number;
  /** Fixed per-glyph debris so the fracture never looks mechanical. */
  debrisX: number;
  debrisY: number;
  debrisSpin: number;
}

export interface FieldConfig {
  /** How far the cursor reaches. */
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
  if (distance >= config.reach) return NO_DISPLACEMENT;

  const falloff = Math.pow(1 - distance / config.reach, 1.5);
  const nx = distance > 0.01 ? dx / distance : 0;
  const ny = distance > 0.01 ? dy / distance : 0;
  return {
    x: nx * config.push * falloff + home.debrisX * config.scatter * falloff,
    y: ny * config.push * falloff + home.debrisY * config.scatter * falloff,
    rotation: home.debrisSpin * config.spin * falloff
  };
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
