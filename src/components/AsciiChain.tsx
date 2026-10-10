import { useEffect, useMemo, useRef } from 'react';
import type { ReactNode } from 'react';
import gsap from 'gsap';
import necklace from '../assets/chain-hero.txt?raw';
import mark from '../assets/chain-mark.txt?raw';
import {
  CHAIN_FIELD,
  easeToward,
  glyphDisplacement,
  isDisplaced,
  NO_DISPLACEMENT,
  toArtworkSpace,
  type ArtworkFrame,
  type Displacement,
  type GlyphHome
} from '../lib/chainField';
import './ascii-chain.css';

/** Original procedural ASCII artwork created for ob4cl, not a third-party logo. */

/** How fast a glyph travels, per frame: quicker into the fracture than back out of it. */
const EASE_OUT = 0.24;
const EASE_HOME = 0.12;

export default function AsciiChain({
  compact = false,
  animated = false
}: {
  compact?: boolean;
  animated?: boolean;
}) {
  const frame = useRef<HTMLDivElement>(null);
  const artwork = useRef<HTMLPreElement>(null);

  /*
   * Every visible glyph becomes its own inline-block element. An inline-block box keeps the same
   * advance width and baseline as the plain character, so the artwork is pixel-identical until
   * the cursor reaches it — and a glyph can then be moved without disturbing the layout. Spaces
   * and newlines stay as text so the block keeps its exact shape.
   */
  const glyphs = useMemo(() => {
    const nodes: ReactNode[] = [];
    for (let index = 0; index < necklace.length; index++) {
      const character = necklace[index];
      if (character === '\n' || character === ' ') {
        nodes.push(character);
        continue;
      }
      nodes.push(
        <span className="chain-glyph" key={index}>
          {character}
        </span>
      );
    }
    return nodes;
  }, []);

  useEffect(() => {
    if (compact || !animated || !frame.current || !artwork.current) return;
    const element = frame.current;
    const art = artwork.current;

    const ctx = gsap.context(() => {
      /* 1. The signature tilt — the whole block leans into the pointer. */
      const xTo = gsap.quickTo(art, 'rotationY', { duration: 0.85, ease: 'power3.out' });
      const yTo = gsap.quickTo(art, 'rotationX', { duration: 0.85, ease: 'power3.out' });

      /* 2. The fracture — glyphs within reach are thrown away from the cursor. */
      const spans = Array.from(art.querySelectorAll<HTMLElement>('.chain-glyph'));
      if (!spans.length) return;

      const homes: GlyphHome[] = spans.map((span) => ({
        x: span.offsetLeft,
        y: span.offsetTop,
        debrisX: Math.random() * 2 - 1,
        debrisY: Math.random() * 2 - 1,
        debrisSpin: Math.random() * 2 - 1
      }));
      const offsets: Displacement[] = spans.map(() => ({ ...NO_DISPLACEMENT }));
      const applied: boolean[] = spans.map(() => false);
      const cursor = { x: 0, y: 0, active: false };
      let raf = 0;

      const artworkFrame = (): ArtworkFrame => {
        const box = art.getBoundingClientRect();
        const raw = getComputedStyle(art).transform;
        let cos = 1;
        let sin = 0;
        if (raw && raw !== 'none' && typeof DOMMatrixReadOnly === 'function') {
          const matrix = new DOMMatrixReadOnly(raw);
          cos = matrix.a || 1;
          sin = matrix.b || 0;
        }
        return {
          left: box.left,
          top: box.top,
          width: box.width,
          height: box.height,
          layoutWidth: art.offsetWidth,
          layoutHeight: art.offsetHeight,
          cos,
          sin
        };
      };

      const stop = () => {
        if (raf) {
          cancelAnimationFrame(raf);
          raf = 0;
        }
      };

      /** Own frame loop: GSAP writes the transforms, the loop just decides when to stop. */
      const tick = () => {
        raf = requestAnimationFrame(tick);
        let moving = false;

        for (let index = 0; index < spans.length; index++) {
          const target = glyphDisplacement(homes[index], cursor, CHAIN_FIELD);
          const offset = easeToward(
            offsets[index],
            target,
            cursor.active ? EASE_OUT : EASE_HOME
          );
          offsets[index] = offset;

          const displaced = isDisplaced(offset);
          if (displaced) {
            gsap.set(spans[index], {
              x: offset.x,
              y: offset.y,
              rotation: offset.rotation,
              force3D: false
            });
            moving = true;
          } else if (applied[index]) {
            gsap.set(spans[index], { clearProps: 'transform' });
          }
          applied[index] = displaced;
        }

        if (!moving && !cursor.active) stop();
      };

      const start = () => {
        if (!raf) raf = requestAnimationFrame(tick);
      };

      const onMove = (event: PointerEvent) => {
        if (event.pointerType === 'touch') return;
        const bounds = element.getBoundingClientRect();
        xTo(((event.clientX - bounds.left) / bounds.width - 0.5) * 26);
        yTo(-((event.clientY - bounds.top) / bounds.height - 0.5) * 20);

        const point = toArtworkSpace(event, artworkFrame());
        cursor.x = point.x;
        cursor.y = point.y;
        cursor.active = true;
        start();
      };

      const onLeave = () => {
        xTo(0);
        yTo(0);
        cursor.active = false;
        start();
      };

      element.addEventListener('pointermove', onMove);
      element.addEventListener('pointerleave', onLeave);

      return () => {
        element.removeEventListener('pointermove', onMove);
        element.removeEventListener('pointerleave', onLeave);
        stop();
        for (let index = 0; index < spans.length; index++) {
          if (applied[index]) gsap.set(spans[index], { clearProps: 'transform' });
        }
      };
    }, element);

    return () => ctx.revert();
  }, [compact, animated]);

  if (compact)
    return (
      <span className="ascii-chain-mark" aria-hidden="true">
        <pre>{mark}</pre>
      </span>
    );

  return (
    <div
      ref={frame}
      className={`ascii-chain${animated ? ' is-live' : ''}`}
      role="img"
      aria-label="ob4cl signature: an original ASCII Cuban-link chain"
    >
      <span className="ascii-chain__coordinate" aria-hidden="true">
        FIG. 001 / IDENTITY
      </span>
      <div className="ascii-chain__art" aria-hidden="true">
        <pre ref={artwork}>{glyphs}</pre>
        <span className="ascii-chain__center">
          INDEPENDENT
          <br />
          <b>BY DESIGN.</b>
          <i>ob4cl</i>
        </span>
      </div>
      <span className="ascii-chain__caption" aria-hidden="true">
        <span>CUBAN LINK / ASCII</span>
        <span>{animated ? 'MOVE TO BREAK THE CHAIN ↗' : 'SIGNATURE MARK'}</span>
      </span>
    </div>
  );
}
