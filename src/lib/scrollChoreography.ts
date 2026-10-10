/**
 * GSAP scroll choreography.
 *
 * All triggers are created inside a single `gsap.context()` scoped to the app root and are
 * reverted on unmount or when motion is turned off, so nothing keeps running in the background.
 * Three effects:
 *
 *   1. hero        — scrub-driven fade/lift of the hero block as it leaves the viewport
 *   2. progress    — the index rail's progress line and the active project marker
 *   3. panels      — per-project parallax on the visual column and drift on the big numeral
 */

import { useEffect } from 'react';
import type { RefObject } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export interface ScrollChoreographyOptions {
  rootRef: RefObject<HTMLElement | null>;
  enabled: boolean;
  onActiveProject?: (id: string | null) => void;
}

export function useScrollChoreography({
  rootRef,
  enabled,
  onActiveProject
}: ScrollChoreographyOptions): void {
  useEffect(() => {
    const root = rootRef.current;
    if (!root || !enabled) return;

    const ctx = gsap.context(() => {
      const hero = root.querySelector<HTMLElement>('[data-hero]');
      const heroInner = root.querySelector<HTMLElement>('[data-hero-inner]');
      if (hero && heroInner) {
        gsap.to(heroInner, {
          opacity: 0,
          yPercent: -14,
          ease: 'none',
          scrollTrigger: {
            trigger: hero,
            start: 'top top',
            end: 'bottom 20%',
            scrub: true
          }
        });
      }

      const progress = root.querySelector<HTMLElement>('[data-rail-progress]');
      const works = root.querySelector<HTMLElement>('[data-works]');
      if (progress && works) {
        gsap.fromTo(
          progress,
          { scaleY: 0 },
          {
            scaleY: 1,
            ease: 'none',
            transformOrigin: 'top center',
            scrollTrigger: {
              trigger: works,
              start: 'top center',
              end: 'bottom bottom',
              scrub: 0.4
            }
          }
        );
      }

      root.querySelectorAll<HTMLElement>('[data-project]').forEach((panel) => {
        const id = panel.dataset.project ?? null;
        const visual = panel.querySelector<HTMLElement>('[data-panel-visual]');
        const numeral = panel.querySelector<HTMLElement>('[data-panel-numeral]');

        if (visual) {
          gsap.fromTo(
            visual,
            { yPercent: 6 },
            {
              yPercent: -6,
              ease: 'none',
              scrollTrigger: { trigger: panel, start: 'top bottom', end: 'bottom top', scrub: 0.6 }
            }
          );
        }

        if (numeral) {
          gsap.fromTo(
            numeral,
            { xPercent: -4, opacity: 0.35 },
            {
              xPercent: 4,
              opacity: 0.9,
              ease: 'none',
              scrollTrigger: { trigger: panel, start: 'top bottom', end: 'bottom top', scrub: 0.6 }
            }
          );
        }

        if (id && onActiveProject) {
          ScrollTrigger.create({
            trigger: panel,
            start: 'top 55%',
            end: 'bottom 55%',
            onToggle: (self) => {
              if (self.isActive) onActiveProject(id);
            }
          });
        }
      });
    }, root);

    // Webfonts and canvases change layout after the first pass.
    const refresh = () => ScrollTrigger.refresh();
    if (typeof document !== 'undefined' && document.fonts?.ready) {
      document.fonts.ready.then(refresh).catch(() => undefined);
    }
    const timeout = window.setTimeout(refresh, 400);

    return () => {
      window.clearTimeout(timeout);
      ctx.revert();
    };
  }, [rootRef, enabled, onActiveProject]);
}
