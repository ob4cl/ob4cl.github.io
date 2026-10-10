import { cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CHAIN_FIELD, GLYPH_TRAITS } from '../lib/chainField';
import AsciiChain from './AsciiChain';

// jsdom is slow with hundreds of DOM writes per frame; these tests pump a lot of frames.
vi.setConfig({ testTimeout: 60000 });

/**
 * Behaviour of the hero chain's break-apart field, against the real component but with a small
 * stand-in artwork: jsdom would take tens of seconds to lay out the 1,300 glyph boxes of the real
 * chain on every render, and this file needs to pump hundreds of frames. The real artwork's split
 * is covered in AsciiChain.test.tsx.
 */
vi.mock('../assets/chain-hero.txt?raw', () => ({
  default: Array.from({ length: 12 }, () => Array.from({ length: 20 }, () => 'X').join('')).join(
    '\n'
  )
}));

const GLYPHS_PER_ROW = 20;
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

/** Parse the numeric parts of a `translate(x, y) rotate(z)` transform. */
const parseTransform = (value: string) => {
  const numbers = value.match(/-?\d+(\.\d+)?/g)?.map(Number) ?? [];
  return { x: numbers[0] ?? 0, y: numbers[1] ?? 0, rotation: numbers[2] ?? 0 };
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
      if (distance > CHAIN_FIELD.reach * GLYPH_TRAITS.senseMax + 15) {
        expect(glyphTransform(glyph)).toBeFalsy();
      }
    });

    // Displacement is a falloff, bounded by push + scatter.
    for (const glyph of moved) {
      expect(magnitude(glyph)).toBeLessThanOrEqual(CHAIN_FIELD.push + CHAIN_FIELD.scatter + 0.01);
      expect(Math.abs(offset(glyph).rotation)).toBeLessThanOrEqual(CHAIN_FIELD.spin + 0.01);
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

  it('ignores touch input so a finger drag never tears the chain apart', () => {
    const { chain, glyphs } = setup();
    const event = pointerEvent('pointermove', CURSOR.x, CURSOR.y);
    Object.defineProperty(event, 'pointerType', { value: 'touch' });
    chain.dispatchEvent(event);
    pump(12);

    expect(glyphs.every((glyph) => !glyphTransform(glyph))).toBe(true);
  });
});
