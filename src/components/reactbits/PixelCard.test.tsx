import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import PixelCard from './PixelCard';

/**
 * jsdom has neither a canvas implementation nor layout, so both are faked here. What is being
 * tested is the pointer field: which pixels light up, how brightly, and where — the drawing calls
 * are recorded and their positions and alphas asserted on.
 */

interface Drawn {
  x: number;
  y: number;
  w: number;
  h: number;
  alpha: number;
}

const CARD_W = 420;
const CARD_H = 315;

let drawings: Drawn[] = [];
let perFrame: number[] = [];

const makeContext = (canvas: HTMLCanvasElement) =>
  ({
    canvas,
    fillStyle: '',
    globalAlpha: 1,
    setTransform: vi.fn(),
    clearRect: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    getImageData: vi.fn(() => ({ data: new Uint8ClampedArray(4) })),
    fillRect(x: number, y: number, w: number, h: number) {
      // eslint-disable-next-line @typescript-eslint/no-this-alias
      const ctx = this as unknown as { globalAlpha: number };
      drawings.push({ x, y, w, h, alpha: ctx.globalAlpha });
    }
  }) as unknown as CanvasRenderingContext2D;

/* requestAnimationFrame is queued (with real ids so cancelling works), then pumped by hand. */
let frameQueue = new Map<number, FrameRequestCallback>();
let nextFrameId = 1;
const pump = (frames: number) => {
  for (let index = 0; index < frames; index++) {
    const queue = Array.from(frameQueue.values());
    frameQueue.clear();
    drawings = [];
    queue.forEach((callback) => callback(performance.now()));
    perFrame.push(drawings.length);
  }
};

const centroid = () => {
  const sumX = drawings.reduce((total, entry) => total + entry.x, 0);
  const sumY = drawings.reduce((total, entry) => total + entry.y, 0);
  return { x: sumX / drawings.length, y: sumY / drawings.length };
};

const distance = (entry: Drawn, x: number, y: number) =>
  Math.hypot(entry.x + entry.w / 2 - x, entry.y + entry.h / 2 - y);

beforeEach(() => {
  drawings = [];
  perFrame = [];
  frameQueue = new Map();
  nextFrameId = 1;
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    const id = nextFrameId++;
    frameQueue.set(id, callback);
    return id;
  });
  vi.stubGlobal('cancelAnimationFrame', (id: number) => {
    frameQueue.delete(id);
  });
  Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
    configurable: true,
    value: function getContext(this: HTMLCanvasElement) {
      return makeContext(this);
    }
  });
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
    configurable: true,
    get: () => CARD_W
  });
  Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
    configurable: true,
    get: () => CARD_H
  });
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const POINTER = { clientX: 210, clientY: 110 };

describe('PixelCard pointer field', () => {
  it('draws nothing at rest — the field only exists under the pointer', () => {
    render(<PixelCard pointerRadius={120} gap={10} colors="#d8ff3e" />);
    pump(20);
    expect(perFrame.every((count) => count === 0)).toBe(true);
  });

  it('lights the pixels around the pointer, and the brightest ones are nearest it', () => {
    const { container } = render(<PixelCard pointerRadius={120} gap={10} colors="#d8ff3e" />);
    const card = container.querySelector('.pixel-card');
    expect(card).not.toBeNull();

    fireEvent.pointerOver(card as HTMLElement, { ...POINTER, relatedTarget: null });
    fireEvent.pointerMove(card as HTMLElement, POINTER);
    pump(30);

    expect(drawings.length).toBeGreaterThan(50);

    const near = centroid();
    expect(Math.abs(near.x - POINTER.clientX)).toBeLessThan(40);
    expect(Math.abs(near.y - POINTER.clientY)).toBeLessThan(40);

    // The trail is a falloff, not a solid block: the brightest pixels sit within reach.
    const bright = drawings.filter((entry) => entry.alpha > 0.8);
    expect(bright.length).toBeGreaterThan(0);
    for (const entry of bright) {
      expect(distance(entry, POINTER.clientX, POINTER.clientY)).toBeLessThanOrEqual(130);
    }

    // Far corners stay at the ambient intensity, not the peak.
    const far = drawings.filter(
      (entry) => distance(entry, POINTER.clientX, POINTER.clientY) > 200
    );
    for (const entry of far) {
      expect(entry.alpha).toBeLessThan(0.5);
    }

    // Proximity also means size: the pixels being lit near the cursor are the bigger ones.
    const biggest = drawings.reduce((max, entry) => Math.max(max, entry.w), 0);
    expect(biggest).toBeGreaterThan(1.5);
  });

  it('publishes the pointer to CSS so the card children can react', () => {
    const { container } = render(<PixelCard pointerRadius={120} gap={10} colors="#d8ff3e" />);
    const card = container.querySelector('.pixel-card') as HTMLElement;
    fireEvent.pointerOver(card, { ...POINTER, relatedTarget: null });
    fireEvent.pointerMove(card, POINTER);

    expect(card.classList.contains('is-pointing')).toBe(true);
    expect(card.style.getPropertyValue('--px')).toBe(`${POINTER.clientX}.0px`);
    expect(card.style.getPropertyValue('--py')).toBe(`${POINTER.clientY}.0px`);
    expect(Number(card.style.getPropertyValue('--ptx'))).toBeCloseTo(0, 2);
    expect(Number(card.style.getPropertyValue('--pty'))).toBeLessThan(0);
  });

  it('clears the field and stops drawing when the pointer leaves', () => {
    const { container } = render(<PixelCard pointerRadius={120} gap={10} colors="#d8ff3e" />);
    const card = container.querySelector('.pixel-card') as HTMLElement;
    fireEvent.pointerOver(card, { ...POINTER, relatedTarget: null });
    fireEvent.pointerMove(card, POINTER);
    pump(20);
    expect(drawings.length).toBeGreaterThan(0);

    fireEvent.pointerLeave(card);
    pump(120);

    expect(card.classList.contains('is-pointing')).toBe(false);
    // After the fade-out the loop has nothing to draw, so the last frames are empty.
    expect(perFrame.slice(-10).every((count) => count === 0)).toBe(true);
  });

  it('falls back to the whole field when no pointer radius is set', () => {
    const { container } = render(<PixelCard gap={10} colors="#d8ff3e" />);
    const card = container.querySelector('.pixel-card') as HTMLElement;
    fireEvent.pointerOver(card, { ...POINTER, relatedTarget: null });
    pump(30);

    // Uniform field: bright pixels reach the far corner as well as the centre.
    const brightFar = drawings.filter(
      (entry) => entry.alpha > 0.8 && distance(entry, POINTER.clientX, POINTER.clientY) > 200
    );
    expect(brightFar.length).toBeGreaterThan(0);
  });
});
