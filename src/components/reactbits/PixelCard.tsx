/**
 * React Bits — `PixelCard`
 * Adapted from DavidHDev/react-bits — https://github.com/DavidHDev/react-bits
 * Upstream source: src/content/Components/PixelCard/PixelCard.jsx (branch `main`)
 * Licence: MIT + Commons Clause License Condition v1.0 — Copyright (c) 2026 David Haz
 * Full notice: /THIRD-PARTY-NOTICES.md
 *
 * Port changes: TypeScript types, and the pixel lifecycle is driven by pointer proximity so the
 * field follows the cursor (a bright trail that fades with distance) instead of only appearing
 * while the card is hovered. The pointer is also published to CSS as `--px`, `--py`, `--ptx` and
 * `--pty` so the card's children — a spotlight, a diagram — can react to the same gesture.
 * Reduced motion keeps the field but removes the shimmer. Device pixel ratio is honoured so the
 * pixels stay crisp on retina displays.
 */

import { useEffect, useRef } from 'react';
import type { FocusEvent, PointerEvent as ReactPointerEvent, ReactNode } from 'react';

import './pixel-card.css';

/** How fast a pixel eases toward its target intensity, per 60fps frame. */
const INTENSITY_EASE = 0.16;
/** Intensity a pixel settles at when the card is hovered but the cursor is elsewhere. */
const IDLE_INTENSITY = 0.22;
/** Intensity of the pixels directly under the cursor. */
const PEAK_INTENSITY = 1;
/** Falloff exponent for the trail — higher is tighter. */
const TRAIL_FALLOFF = 1.7;

class Pixel {
  width: number;
  height: number;
  ctx: CanvasRenderingContext2D;
  x: number;
  y: number;
  color: string;
  minSize = 0.5;
  maxSizeInteger = 2;
  maxSize: number;
  /** Shimmer rate in radians per frame (0 when motion is reduced). */
  pulseRate: number;
  /** Fixed per-pixel variation so the field never pulses in lockstep. */
  jitter: number;
  phase: number;
  size = 0;
  intensity = 0;
  target = 0;
  isIdle = true;

  constructor(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    color: string,
    pulseRate: number,
    jitter: number
  ) {
    this.width = ctx.canvas.width;
    this.height = ctx.canvas.height;
    this.ctx = ctx;
    this.x = x;
    this.y = y;
    this.color = color;
    this.maxSize = this.getRandomValue(this.minSize, this.maxSizeInteger);
    this.pulseRate = pulseRate;
    this.jitter = jitter;
    this.phase = Math.random() * Math.PI * 2;
  }

  getRandomValue(min: number, max: number): number {
    return Math.random() * (max - min) + min;
  }

  /** Advance one frame. Returns true while the pixel still needs to be drawn. */
  update(): boolean {
    this.intensity += (this.target - this.intensity) * INTENSITY_EASE;
    if (Math.abs(this.target - this.intensity) < 0.004) {
      this.intensity = this.target;
    }

    if (this.intensity === 0 && this.size <= 0.04) {
      this.size = 0;
      this.isIdle = true;
      return false;
    }

    const shimmer =
      this.pulseRate === 0 ? 1 : 0.84 + 0.16 * Math.sin(this.phase);
    this.phase += this.pulseRate * this.jitter;

    const goal =
      this.intensity === 0 ? 0 : this.maxSize * (0.32 + 0.68 * this.intensity) * shimmer;

    if (this.size < goal) {
      this.size = Math.min(goal, this.size + 0.14 + 0.24 * this.intensity);
    } else if (this.size > goal) {
      this.size = Math.max(goal, this.size - 0.4);
    }

    this.isIdle = false;
    return true;
  }

  draw(): void {
    const centerOffset = this.maxSize * 0.5 - this.size * 0.5;
    this.ctx.globalAlpha = 0.22 + 0.78 * this.intensity;
    this.ctx.fillStyle = this.color;
    this.ctx.fillRect(this.x + centerOffset, this.y + centerOffset, this.size, this.size);
  }
}

function getEffectiveSpeed(value: number | string, reducedMotion: boolean): number {
  const min = 0;
  const max = 100;
  const throttle = 0.001;
  const parsed = parseInt(String(value), 10);

  if (parsed <= min || reducedMotion) {
    return min;
  } else if (parsed >= max) {
    return max * throttle;
  } else {
    return parsed * throttle;
  }
}

interface VariantConfig {
  activeColor: string | null;
  gap: number;
  speed: number;
  colors: string;
  noFocus: boolean;
}

const VARIANTS: Record<string, VariantConfig> = {
  default: {
    activeColor: null,
    gap: 5,
    speed: 35,
    colors: '#f8fafc,#f1f5f9,#cbd5e1',
    noFocus: false
  },
  blue: {
    activeColor: '#e0f2fe',
    gap: 10,
    speed: 25,
    colors: '#e0f2fe,#7dd3fc,#0ea5e9',
    noFocus: false
  },
  yellow: {
    activeColor: '#fef08a',
    gap: 3,
    speed: 20,
    colors: '#fef08a,#fde047,#eab308',
    noFocus: false
  },
  pink: {
    activeColor: '#fecdd3',
    gap: 6,
    speed: 80,
    colors: '#fecdd3,#fda4af,#e11d48',
    noFocus: true
  }
};

export interface PixelCardProps {
  variant?: keyof typeof VARIANTS | string;
  gap?: number;
  speed?: number;
  colors?: string;
  noFocus?: boolean;
  className?: string;
  /**
   * Radius, in CSS pixels, around the cursor in which pixels light up. `0` falls back to the
   * upstream behaviour: the whole field appears while the card is hovered.
   */
  pointerRadius?: number;
  children?: ReactNode;
}

export default function PixelCard({
  variant = 'default',
  gap,
  speed,
  colors,
  noFocus,
  className = '',
  pointerRadius = 0,
  children
}: PixelCardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pixelsRef = useRef<Pixel[]>([]);
  const gridRef = useRef({ cols: 0, rows: 0, step: 1 });
  const animationRef = useRef(0);
  const pointerRef = useRef({
    x: -1,
    y: -1,
    inside: false,
    dirty: false,
    last: { c0: 0, c1: -1, r0: 0, r1: -1 }
  });
  const reducedMotion = useRef(
    typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ).current;

  const variantCfg = VARIANTS[variant] || VARIANTS.default;
  const finalGap = gap ?? variantCfg.gap;
  const finalSpeed = speed ?? variantCfg.speed;
  const finalColors = colors ?? variantCfg.colors;
  const finalNoFocus = noFocus ?? variantCfg.noFocus;

  const initPixels = () => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const width = Math.max(1, Math.floor(container.clientWidth));
    const height = Math.max(1, Math.floor(container.clientHeight));
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw in CSS pixels: the backing store carries the extra resolution.
    const dpr = Math.min(typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const step = Math.max(2, parseInt(String(finalGap), 10));
    const cols = Math.max(1, Math.floor(width / step) + 1);
    const rows = Math.max(1, Math.floor(height / step) + 1);
    const colorsArray = finalColors
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean);
    const pulseRate = getEffectiveSpeed(finalSpeed, reducedMotion) * 2.2;

    const pxs: Pixel[] = [];
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const color = colorsArray[Math.floor(Math.random() * colorsArray.length)];
        pxs.push(
          new Pixel(ctx, col * step, row * step, color, pulseRate, 0.6 + Math.random() * 0.8)
        );
      }
    }

    pixelsRef.current = pxs;
    gridRef.current = { cols, rows, step };
    pointerRef.current.last = { c0: 0, c1: -1, r0: 0, r1: -1 };

    // A resize throws the field away; re-apply whatever the pointer is doing.
    if (pointerRef.current.inside) {
      applyPointerTargets();
    }
  };

  /** Write the pointer's influence into the pixel targets around it. */
  const applyPointerTargets = () => {
    const pixels = pixelsRef.current;
    const { cols, step } = gridRef.current;
    if (!pixels.length) return;

    const { x, y, inside, last } = pointerRef.current;

    // Hand the cells the cursor has left back to the ambient intensity.
    for (let col = last.c0; col <= last.c1; col++) {
      for (let row = last.r0; row <= last.r1; row++) {
        const pixel = pixels[row * cols + col];
        if (pixel) pixel.target = IDLE_INTENSITY;
      }
    }

    if (!inside || pointerRadius <= 0) {
      pointerRef.current.last = { c0: 0, c1: -1, r0: 0, r1: -1 };
      return;
    }

    const c0 = Math.max(0, Math.floor((x - pointerRadius) / step));
    const c1 = Math.min(cols - 1, Math.ceil((x + pointerRadius) / step));
    const r0 = Math.max(0, Math.floor((y - pointerRadius) / step));
    const r1 = Math.min(gridRef.current.rows - 1, Math.ceil((y + pointerRadius) / step));

    for (let col = c0; col <= c1; col++) {
      for (let row = r0; row <= r1; row++) {
        const pixel = pixels[row * cols + col];
        if (!pixel) continue;
        const distance = Math.hypot(pixel.x - x, pixel.y - y);
        if (distance >= pointerRadius) continue;
        const proximity = 1 - distance / pointerRadius;
        pixel.target =
          IDLE_INTENSITY + (PEAK_INTENSITY - IDLE_INTENSITY) * Math.pow(proximity, TRAIL_FALLOFF);
      }
    }

    pointerRef.current.last = { c0, c1, r0, r1 };
  };

  const animate = () => {
    animationRef.current = requestAnimationFrame(animate);

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || !pixelsRef.current.length) return;

    if (pointerRef.current.dirty) {
      applyPointerTargets();
      pointerRef.current.dirty = false;
    }

    // The context carries the device-pixel-ratio transform, so clearing in CSS pixels is enough.
    ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);

    const pixels = pixelsRef.current;
    let alive = false;
    for (let i = 0; i < pixels.length; i++) {
      const pixel = pixels[i];
      if (pixel.update()) {
        pixel.draw();
        alive = true;
      }
    }

    if (!alive && !pointerRef.current.inside) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = 0;
    }
  };

  const start = () => {
    if (animationRef.current) return;
    animationRef.current = requestAnimationFrame(animate);
  };

  const publishPointer = (x: number, y: number) => {
    const container = containerRef.current;
    if (!container) return;
    const width = container.clientWidth || 1;
    const height = container.clientHeight || 1;
    container.style.setProperty('--px', `${x.toFixed(1)}px`);
    container.style.setProperty('--py', `${y.toFixed(1)}px`);
    container.style.setProperty('--ptx', ((x / width) * 2 - 1).toFixed(3));
    container.style.setProperty('--pty', ((y / height) * 2 - 1).toFixed(3));
  };

  const setPointerFromEvent = (event: ReactPointerEvent<HTMLDivElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    pointerRef.current.x = x;
    pointerRef.current.y = y;
    pointerRef.current.dirty = true;
    publishPointer(x, y);
  };

  const enter = (event: ReactPointerEvent<HTMLDivElement>) => {
    pointerRef.current.inside = true;
    // A class rather than CSS :hover — the same state is what lights the field, and it survives
    // touch and pen input where :hover never matches.
    containerRef.current?.classList.add('is-pointing');
    if (pointerRadius <= 0) {
      for (const pixel of pixelsRef.current) pixel.target = PEAK_INTENSITY;
    }
    setPointerFromEvent(event);
    start();
  };

  const move = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!pointerRef.current.inside) return;
    setPointerFromEvent(event);
  };

  const leave = (touched = false) => {
    pointerRef.current.inside = false;
    pointerRef.current.x = -1;
    pointerRef.current.y = -1;
    pointerRef.current.last = { c0: 0, c1: -1, r0: 0, r1: -1 };
    for (const pixel of pixelsRef.current) pixel.target = 0;
    const container = containerRef.current;
    if (container) {
      container.classList.remove('is-pointing');
      container.style.setProperty('--ptx', '0');
      container.style.setProperty('--pty', '0');
      if (touched) {
        container.style.removeProperty('--px');
        container.style.removeProperty('--py');
      }
    }
  };

  const onPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    // A finger is not a hover: let the trail go once the touch ends.
    if (event.pointerType !== 'mouse') leave(true);
  };

  // Keyboard focus lights the field for visitors who never use a pointer.
  const onFocus = (event: FocusEvent<HTMLDivElement>) => {
    if (event.currentTarget.contains(event.relatedTarget)) return;
    pointerRef.current.inside = true;
    if (pointerRadius <= 0) {
      for (const pixel of pixelsRef.current) pixel.target = PEAK_INTENSITY;
    }
    start();
  };

  const onBlur = (event: FocusEvent<HTMLDivElement>) => {
    if (event.currentTarget.contains(event.relatedTarget)) return;
    leave();
  };

  useEffect(() => {
    initPixels();
    // ResizeObserver is in every browser this site targets; guard anyway so a missing one degrades
    // to a fixed field instead of throwing.
    const observer =
      typeof ResizeObserver === 'function'
        ? new ResizeObserver(() => {
            initPixels();
          })
        : null;
    const container = containerRef.current;
    if (container && observer) observer.observe(container);
    return () => {
      observer?.disconnect();
      cancelAnimationFrame(animationRef.current);
      animationRef.current = 0;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finalGap, finalSpeed, finalColors, finalNoFocus]);

  return (
    <div
      ref={containerRef}
      className={`pixel-card ${className}`}
      onPointerEnter={enter}
      onPointerMove={move}
      onPointerLeave={() => leave()}
      onPointerCancel={() => leave(true)}
      onPointerUp={onPointerUp}
      onFocus={finalNoFocus ? undefined : onFocus}
      onBlur={finalNoFocus ? undefined : onBlur}
      tabIndex={finalNoFocus ? -1 : 0}
    >
      <canvas className="pixel-canvas" ref={canvasRef} />
      {children}
    </div>
  );
}
