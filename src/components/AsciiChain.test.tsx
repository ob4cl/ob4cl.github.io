import { cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import AsciiChain from './AsciiChain';

// jsdom renders the ~1,300 glyph boxes slowly; give these tests room to breathe.
vi.setConfig({ testTimeout: 30000 });

/**
 * The hero chain's break-apart field, tested against the real component. jsdom has no layout, so
 * each glyph is given a deterministic grid position; the artwork's own box is treated as an origin
 * at 0,0, which makes the pointer's artwork-space coordinates equal to its client coordinates.
 */

const GLYPHS_PER_ROW = 50;
const X_STEP = 4;
const Y_STEP = 8;
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

describe('AsciiChain break-apart field', () => {
  it('splits the artwork into one movable box per visible glyph, leaving spaces as text', () => {
    const { container } = render(<AsciiChain animated />);
    const art = container.querySelector('.ascii-chain__art pre');
    expect(art).not.toBeNull();

    const glyphs = container.querySelectorAll('.chain-glyph');
    expect(glyphs.length).toBeGreaterThan(1000);
    // Spaces are not boxes: every glyph box holds exactly one non-space character.
    for (const glyph of Array.from(glyphs).slice(0, 200)) {
      expect(glyph.textContent?.length).toBe(1);
      expect(glyph.textContent).not.toBe(' ');
    }
    // The artwork's lines survive the split.
    expect(art?.textContent?.split('\n').length).toBe(50);
  });

  it('leaves the chain alone until the pointer arrives', () => {
    const { container } = render(<AsciiChain animated />);
    pump(10);
    const glyphs = container.querySelectorAll('.chain-glyph');
    expect(Array.from(glyphs).every((glyph) => !glyphTransform(glyph))).toBe(true);
  });

  it('throws the glyphs nearest the cursor the furthest, and leaves the rest alone', () => {
    const { container } = render(<AsciiChain animated />);
    const chain = container.querySelector('.ascii-chain') as HTMLElement;
    const cursor = { x: 100, y: 80 };

    chain.dispatchEvent(pointerEvent('pointermove', cursor.x, cursor.y));
    pump(12);

    const glyphs = Array.from(container.querySelectorAll('.chain-glyph'));
    const moved = glyphs.filter((glyph) => glyphTransform(glyph));
    expect(moved.length).toBeGreaterThan(20);

    // Nothing outside the field's reach is displaced.
    glyphs.forEach((glyph, index) => {
      const home = homeOf(index);
      const distance = Math.hypot(home.x - cursor.x, home.y - cursor.y);
      if (distance > 165) {
        expect(glyphTransform(glyph)).toBeFalsy();
      }
    });

    // Displacement is a falloff, bounded by push + scatter.
    for (const glyph of moved) {
      const value = offset(glyph);
      expect(Math.hypot(value.x, value.y)).toBeLessThanOrEqual(26 + 13 + 0.01);
      expect(Math.abs(value.rotation)).toBeLessThanOrEqual(34 + 0.01);
    }

    // A glyph just right of the cursor is thrown further right — away from it, not toward it.
    const rightOfCursor = glyphs.find((_glyph, index) => {
      const home = homeOf(index);
      return home.x > cursor.x && home.x < cursor.x + 8 && home.y === cursor.y;
    });
    expect(rightOfCursor).toBeDefined();
    expect(offset(rightOfCursor as Element).x).toBeGreaterThan(0);
  });

  it('pulls the chain back together when the pointer leaves', () => {
    const { container } = render(<AsciiChain animated />);
    const chain = container.querySelector('.ascii-chain') as HTMLElement;

    chain.dispatchEvent(pointerEvent('pointermove', 100, 80));
    pump(12);
    const glyphs = Array.from(container.querySelectorAll('.chain-glyph'));
    expect(glyphs.some((glyph) => glyphTransform(glyph))).toBe(true);

    chain.dispatchEvent(pointerEvent('pointerleave', 0, 0));
    pump(120);

    expect(glyphs.every((glyph) => !glyphTransform(glyph))).toBe(true);
    // The loop stops itself once the chain is whole again.
    expect(frameQueue.size).toBe(0);
  });

  it('ignores touch input so a finger drag never tears the chain apart', () => {
    const { container } = render(<AsciiChain animated />);
    const chain = container.querySelector('.ascii-chain') as HTMLElement;
    const event = pointerEvent('pointermove', 100, 80);
    Object.defineProperty(event, 'pointerType', { value: 'touch' });
    chain.dispatchEvent(event);
    pump(12);

    const glyphs = Array.from(container.querySelectorAll('.chain-glyph'));
    expect(glyphs.every((glyph) => !glyphTransform(glyph))).toBe(true);
  });

  it('renders the compact mark without splitting anything', () => {
    const { container } = render(<AsciiChain compact />);
    expect(container.querySelector('.chain-glyph')).toBeNull();
    expect(container.querySelector('.ascii-chain-mark')).not.toBeNull();
  });
});
