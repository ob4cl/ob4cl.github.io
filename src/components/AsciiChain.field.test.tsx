import { cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CHAIN_FIELD, FIELD_LIMITS, glyphClass, type GlyphClass } from '../lib/chainField';
import AsciiChain from './AsciiChain';

// jsdom is slow with hundreds of DOM writes per frame; these tests pump a lot of frames.
vi.setConfig({ testTimeout: 60000 });

/**
 * Behaviour of the hero chain's break-apart field, against the real component but with a small
 * stand-in artwork: jsdom would take tens of seconds to lay out the 1,300 glyph boxes of the real
 * chain on every render, and this file needs to pump hundreds of frames. The real artwork's split
 * is covered in AsciiChain.test.tsx.
 *
 * The stand-in mixes registers on purpose — a digit, a lowercase letter and symbols sit next to
 * the capitals — so the class behaviour is exercised here too.
 */
const ROW = 'X2a#H5s@M3r&'.repeat(2);
// The artwork literal is inlined because `vi.mock` is hoisted above module scope.
vi.mock('../assets/chain-hero.txt?raw', () => ({
  default: Array.from({ length: 12 }, () => 'X2a#H5s@M3r&'.repeat(2)).join('\n')
}));

const GLYPHS_PER_ROW = ROW.length;
const X_STEP = 16;
const Y_STEP = 16;

/** Home position of the nth visible glyph, in the same order the artwork is built. */
const homeOf = (index: number) => ({
  x: (index % GLYPHS_PER_ROW) * X_STEP,
  y: Math.floor(index / GLYPHS_PER_ROW) * Y_STEP
});

let frameQueue = new Map<number, FrameRequestCallback>();
let nextFrameId = 1;
const pump = (frames: number) => {
  for (let index = 0; index < frames; index++) {
    const queue = Array.from(frameQueue.values());
    frameQueue.clear();
    queue.forEach((callback) => callback(performance.now()));
  }
};

/** Position of each glyph box among its siblings — jsdom has no layout of its own. */
let glyphIndex: Map<Element, number> | null = null;
const indexOfGlyph = (element: HTMLElement) => {
  if (!glyphIndex) {
    glyphIndex = new Map(
      Array.from(document.querySelectorAll('.chain-glyph')).map((glyph, index) => [glyph, index])
    );
  }
  return glyphIndex.get(element) ?? 0;
};

const pointerEvent = (type: string, x: number, y: number) => {
  const event =
    typeof PointerEvent === 'function'
      ? new PointerEvent(type, { bubbles: true, clientX: x, clientY: y })
      : new Event(type, { bubbles: true });
  if (!(event instanceof PointerEvent)) {
    Object.assign(event, { clientX: x, clientY: y, pointerType: 'mouse' });
  }
  return event;
};

const glyphTransform = (element: Element) => (element as HTMLElement).style.transform;

/** Parse the numeric parts of a `translate(x, y) rotate(z) scale(s)` transform. */
const parseTransform = (value: string) => {
  const numbers = value.match(/-?\d+(\.\d+)?/g)?.map(Number) ?? [];
  return { x: numbers[0] ?? 0, y: numbers[1] ?? 0, rotation: numbers[2] ?? 0, scale: numbers[3] ?? 1 };
};

const offset = (element: Element) => parseTransform(glyphTransform(element) || '');
const magnitude = (element: Element) => {
  const value = offset(element);
  return Math.hypot(value.x, value.y);
};

beforeEach(() => {
  frameQueue = new Map();
  nextFrameId = 1;
  glyphIndex = null;
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    const id = nextFrameId++;
    frameQueue.set(id, callback);
    return id;
  });
  vi.stubGlobal('cancelAnimationFrame', (id: number) => {
    frameQueue.delete(id);
  });
  Object.defineProperty(HTMLElement.prototype, 'offsetLeft', {
    configurable: true,
    get(this: HTMLElement) {
      if (!this.classList?.contains('chain-glyph')) return 0;
      return homeOf(indexOfGlyph(this)).x;
    }
  });
  Object.defineProperty(HTMLElement.prototype, 'offsetTop', {
    configurable: true,
    get(this: HTMLElement) {
      if (!this.classList?.contains('chain-glyph')) return 0;
      return homeOf(indexOfGlyph(this)).y;
    }
  });
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const CURSOR = { x: 100, y: 80 };

const setup = () => {
  const { container } = render(<AsciiChain animated />);
  const chain = container.querySelector('.ascii-chain') as HTMLElement;
  const glyphs = Array.from(container.querySelectorAll('.chain-glyph'));
  return { chain, glyphs };
};

describe('AsciiChain break-apart field', () => {
  it('leaves the chain alone until the pointer arrives', () => {
    const { glyphs } = setup();
    pump(10);
    expect(glyphs.every((glyph) => !glyphTransform(glyph))).toBe(true);
  });

  it('throws the glyphs nearest the cursor furthest, and leaves the rest alone', () => {
    const { chain, glyphs } = setup();
    chain.dispatchEvent(pointerEvent('pointermove', CURSOR.x, CURSOR.y));
    pump(20);

    const moved = glyphs.filter((glyph) => glyphTransform(glyph));
    expect(moved.length).toBeGreaterThan(10);

    // Nothing outside the field's reach is displaced. Sensitivity varies per glyph, so the widest
    // the field can ever reach is reach x the largest sensitivity.
    glyphs.forEach((glyph, index) => {
      const home = homeOf(index);
      const distance = Math.hypot(home.x - CURSOR.x, home.y - CURSOR.y);
      if (distance > CHAIN_FIELD.reach * FIELD_LIMITS.senseMax + 15) {
        expect(glyphTransform(glyph)).toBeFalsy();
      }
    });

    // Displacement is a falloff, bounded by the class weight on top of push + scatter.
    for (const glyph of moved) {
      expect(magnitude(glyph)).toBeLessThanOrEqual(
        CHAIN_FIELD.push * FIELD_LIMITS.gainMax + CHAIN_FIELD.scatter + 0.01
      );
      expect(Math.abs(offset(glyph).rotation)).toBeLessThanOrEqual(
        CHAIN_FIELD.spin * FIELD_LIMITS.tumbleMax + 0.01
      );
    }

    // Glyphs to the right of the cursor are, on the whole, thrown further right — away from it.
    const rightOfCursor = moved.filter((glyph) => {
      const home = homeOf(glyphs.indexOf(glyph));
      return home.x > CURSOR.x && home.y === CURSOR.y && home.x < CURSOR.x + 80;
    });
    const meanX =
      rightOfCursor.reduce((total, glyph) => total + offset(glyph).x, 0) / rightOfCursor.length;
    expect(rightOfCursor.length).toBeGreaterThan(2);
    expect(meanX).toBeGreaterThan(0);
  });

  it('moves each glyph differently — different directions, distances and speeds', () => {
    const { chain, glyphs } = setup();
    chain.dispatchEvent(pointerEvent('pointermove', CURSOR.x, CURSOR.y));

    // Three frames in, the glyphs with the highest rate have already travelled further.
    pump(3);
    const early = glyphs.map((glyph) => magnitude(glyph));
    const travelled = early.filter((value) => value > 0);
    expect(travelled.length).toBeGreaterThan(5);
    expect(Math.max(...early) - Math.min(...travelled)).toBeGreaterThan(0.3);

    pump(25);
    const moved = glyphs.filter((glyph) => glyphTransform(glyph));
    const vectors = moved.map((glyph) => {
      const value = offset(glyph);
      return { angle: Math.atan2(value.y, value.x), size: Math.hypot(value.x, value.y) };
    });
    // Directions fan out rather than all pointing radially away from the cursor...
    const angles = vectors.map((vector) => vector.angle);
    expect(Math.max(...angles) - Math.min(...angles)).toBeGreaterThan(0.35);
    // ...and so do the distances.
    const sizes = vectors.map((vector) => vector.size).sort((a, b) => a - b);
    expect(sizes[sizes.length - 1] - sizes[0]).toBeGreaterThan(0.5);
  });

  it('pulls the chain back together when the pointer leaves', () => {
    const { chain, glyphs } = setup();
    chain.dispatchEvent(pointerEvent('pointermove', CURSOR.x, CURSOR.y));
    pump(20);

    const moved = glyphs.filter((glyph) => glyphTransform(glyph));
    expect(moved.length).toBeGreaterThan(10);
    const peak = Math.max(...moved.map((glyph) => magnitude(glyph)));
    expect(peak).toBeGreaterThan(1);

    chain.dispatchEvent(pointerEvent('pointerleave', 0, 0));
    pump(40);
    const midway = Math.max(...moved.map((glyph) => magnitude(glyph)));
    expect(midway).toBeLessThan(peak);

    // Each glyph has its own speed, so the slowest still needs a while to settle.
    pump(160);
    expect(glyphs.every((glyph) => !glyphTransform(glyph))).toBe(true);
    // And the loop stops itself once the chain is whole again.
    expect(frameQueue.size).toBe(0);
  });

  it('shrinks the pieces while the chain is broken apart', () => {
    const { chain, glyphs } = setup();
    chain.dispatchEvent(pointerEvent('pointermove', CURSOR.x, CURSOR.y));
    pump(30);

    const broken = glyphs.filter((glyph) => glyphTransform(glyph));
    expect(broken.length).toBeGreaterThan(10);

    const scales = broken.map((glyph) => offset(glyph).scale);
    // Every piece is smaller than a whole character, and none of them disappears.
    expect(Math.max(...scales)).toBeLessThanOrEqual(1);
    expect(Math.min(...scales)).toBeLessThan(1);
    expect(Math.min(...scales)).toBeGreaterThanOrEqual(
      1 - CHAIN_FIELD.shrink * FIELD_LIMITS.depthMax - 0.001
    );

    // The further a piece is thrown, the smaller it gets: the smallest sits under the cursor.
    const nearest = broken
      .map((glyph) => ({ glyph, home: homeOf(glyphs.indexOf(glyph)) }))
      .sort((a, b) => offset(a.glyph).scale - offset(b.glyph).scale)[0];
    expect(Math.hypot(nearest.home.x - CURSOR.x, nearest.home.y - CURSOR.y)).toBeLessThan(40);

    // And a piece on its way home grows back before it lands.
    chain.dispatchEvent(pointerEvent('pointerleave', 0, 0));
    pump(60);
    const returning = glyphs.filter((glyph) => glyphTransform(glyph)).map((glyph) => offset(glyph).scale);
    expect(Math.min(...returning)).toBeGreaterThan(Math.min(...scales));
  });

  it('breaks numbers, letters and symbols apart differently', () => {
    const { chain, glyphs } = setup();
    chain.dispatchEvent(pointerEvent('pointermove', CURSOR.x, CURSOR.y));
    pump(40);

    const byClass: Record<GlyphClass, { size: number; spin: number; scale: number }[]> = {
      digit: [],
      upper: [],
      lower: [],
      symbol: []
    };
    glyphs.forEach((glyph) => {
      if (!glyphTransform(glyph)) return;
      const value = offset(glyph);
      byClass[glyphClass(glyph.textContent ?? '')].push({
        size: Math.hypot(value.x, value.y),
        spin: Math.abs(value.rotation),
        scale: value.scale
      });
    });

    for (const kind of Object.keys(byClass) as GlyphClass[]) {
      expect(byClass[kind].length, `${kind} glyphs should have broken apart`).toBeGreaterThan(3);
    }

    type Broken = { size: number; spin: number; scale: number };
    const average = (list: Broken[], pick: (entry: Broken) => number) =>
      list.reduce((total, entry) => total + pick(entry), 0) / list.length;
    // Measuring per pixel travelled cancels the distance falloff, so what is left is the class's
    // own register: how hard it rolls and how far it retreats for the same throw.
    const perPixel = (list: Broken[], pick: (entry: Broken) => number) =>
      average(
        list.filter((entry) => entry.size > 0.4),
        (entry) => pick(entry) / entry.size
      );

    // Capitals are the heavy links: for the same throw they barely tumble and barely shrink...
    expect(perPixel(byClass.upper, (entry) => entry.spin)).toBeLessThan(
      perPixel(byClass.symbol, (entry) => entry.spin) / 1.3
    );
    expect(perPixel(byClass.upper, (entry) => 1 - entry.scale)).toBeLessThan(
      perPixel(byClass.symbol, (entry) => 1 - entry.scale) / 1.3
    );
    // ...while digits, in the middle, roll harder than a capital and hold their shape longer.
    expect(perPixel(byClass.digit, (entry) => entry.spin)).toBeGreaterThan(
      perPixel(byClass.upper, (entry) => entry.spin) * 1.3
    );
    expect(perPixel(byClass.digit, (entry) => 1 - entry.scale)).toBeGreaterThan(
      perPixel(byClass.upper, (entry) => 1 - entry.scale)
    );
  });

  it('ignores touch input so a finger drag never tears the chain apart', () => {
    const { chain, glyphs } = setup();
    const event = pointerEvent('pointermove', CURSOR.x, CURSOR.y);
    Object.defineProperty(event, 'pointerType', { value: 'touch' });
    chain.dispatchEvent(event);
    pump(12);

    expect(glyphs.every((glyph) => !glyphTransform(glyph))).toBe(true);
  });
});
