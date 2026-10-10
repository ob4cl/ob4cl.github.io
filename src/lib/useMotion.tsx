import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import {
  MOTION_ATTRIBUTE,
  type MotionPreference,
  applyPreference,
  persistPreference,
  readStoredPreference,
  resolvePreference,
  safeStorage,
  systemPrefersReducedMotion,
  togglePreference
} from './motion';

interface MotionContextValue {
  /** `'on'` when animated, `'off'` when the visitor or their OS asked for stillness. */
  motion: MotionPreference;
  /** True only when the visitor made an explicit choice (an OS default is not a choice). */
  explicit: boolean;
  setMotion: (preference: MotionPreference) => void;
  toggleMotion: () => void;
  resetToSystem: () => void;
}

const MotionContext = createContext<MotionContextValue | null>(null);

export function MotionProvider({ children }: { children: ReactNode }) {
  const [stored, setStored] = useState<MotionPreference | null>(() => readStoredPreference());
  const [prefersReduced, setPrefersReduced] = useState<boolean>(() => systemPrefersReducedMotion());

  const motion = resolvePreference(stored, prefersReduced);
  const explicit = stored !== null;

  // Keep <html data-motion> in sync, including the very first paint after hydration.
  useEffect(() => {
    applyPreference(document.documentElement, motion);
  }, [motion]);

  // React to OS changes while the page is open (only relevant without an explicit choice).
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = (event: MediaQueryListEvent) => setPrefersReduced(event.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  // Keep two open tabs in agreement.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onStorage = (event: StorageEvent) => {
      if (event.key && event.key !== 'ob4cl.motion') return;
      setStored(readStoredPreference());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const setMotion = useCallback((preference: MotionPreference) => {
    persistPreference(preference, safeStorage());
    setStored(preference);
  }, []);

  const toggleMotion = useCallback(() => {
    setStored((current) => {
      const base = resolvePreference(current, systemPrefersReducedMotion());
      const next = togglePreference(base);
      persistPreference(next, safeStorage());
      return next;
    });
  }, []);

  const resetToSystem = useCallback(() => {
    persistPreference(null, safeStorage());
    setStored(null);
    setPrefersReduced(systemPrefersReducedMotion());
  }, []);

  const value = useMemo<MotionContextValue>(
    () => ({ motion, explicit, setMotion, toggleMotion, resetToSystem }),
    [motion, explicit, setMotion, toggleMotion, resetToSystem]
  );

  return <MotionContext.Provider value={value}>{children}</MotionContext.Provider>;
}

export function useMotion(): MotionContextValue {
  const value = useContext(MotionContext);
  if (!value) throw new Error('useMotion must be used inside <MotionProvider>');
  return value;
}

/** Convenience: is animation allowed right now? */
export function useMotionEnabled(): boolean {
  return useMotion().motion === 'on';
}

export { MOTION_ATTRIBUTE };
