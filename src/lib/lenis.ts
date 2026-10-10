/**
 * Lenis smooth scrolling, wired into the GSAP ticker so ScrollTrigger stays in sync.
 *
 * Smooth scroll is treated as motion: with the preference set to "off" no Lenis instance is
 * created at all and the page falls back to native scrolling, where in-page navigation uses an
 * instant jump instead of an animated one.
 */

import { useEffect } from 'react';
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

let activeLenis: Lenis | null = null;

export function getActiveLenis(): Lenis | null {
  return activeLenis;
}

/** Scroll to an element by id (used by the index rail, skip link targets and the inspector). */
export function scrollToId(id: string, options: { offset?: number } = {}): void {
  const target = document.getElementById(id);
  if (!target) return;
  const offset = options.offset ?? 0;

  if (activeLenis) {
    activeLenis.scrollTo(target, { offset, duration: 1.15 });
    return;
  }

  const top = target.getBoundingClientRect().top + window.scrollY + offset;
  window.scrollTo({ top: Math.max(0, top), behavior: 'auto' });
}

/** Freeze the page behind a modal, with or without Lenis present. */
export function setScrollLocked(locked: boolean): void {
  const root = document.documentElement;
  if (activeLenis) {
    if (locked) activeLenis.stop();
    else activeLenis.start();
  }
  root.classList.toggle('is-scroll-locked', locked);
}

export function useSmoothScroll(enabled: boolean): void {
  useEffect(() => {
    if (!enabled) return;
    if (typeof window === 'undefined') return;

    const lenis = new Lenis({
      duration: 1.05,
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.5,
      autoRaf: false
    });
    activeLenis = lenis;

    const onScroll = () => ScrollTrigger.update();
    lenis.on('scroll', onScroll);

    const raf = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    // Content height changes (fonts, canvases, inspector) must re-measure the triggers.
    const observer = new ResizeObserver(() => ScrollTrigger.refresh());
    observer.observe(document.body);

    return () => {
      observer.disconnect();
      gsap.ticker.remove(raf);
      lenis.off('scroll', onScroll);
      lenis.destroy();
      activeLenis = null;
      document.documentElement.classList.remove('is-scroll-locked');
    };
  }, [enabled]);
}
