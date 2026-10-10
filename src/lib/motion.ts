/**
 * Motion preference — pure helpers.
 *
 * The visitor can turn motion off explicitly (persisted), and the OS-level
 * `prefers-reduced-motion: reduce` is honoured by default. These functions are pure so they can
 * be unit-tested directly; the React binding lives in `useMotion.tsx`.
 */

export type MotionPreference = 'on' | 'off';

export const MOTION_STORAGE_KEY = 'ob4cl.motion';

/** Narrow globalThis to a Storage without throwing in locked-down browsers. */
export function safeStorage(): Storage | null {
  try {
    if (typeof window === 'undefined') return null;
    return window.localStorage;
  } catch {
    return null;
  }
}

export function readStoredPreference(storage: Storage | null = safeStorage()): MotionPreference | null {
  if (!storage) return null;
  try {
    const raw = storage.getItem(MOTION_STORAGE_KEY);
    return raw === 'on' || raw === 'off' ? raw : null;
  } catch {
    return null;
  }
}

export function persistPreference(
  preference: MotionPreference | null,
  storage: Storage | null = safeStorage()
): void {
  if (!storage) return;
  try {
    if (preference === null) storage.removeItem(MOTION_STORAGE_KEY);
    else storage.setItem(MOTION_STORAGE_KEY, preference);
  } catch {
    /* storage disabled — the preference simply does not persist */
  }
}

export function systemPrefersReducedMotion(
  matchMediaFn: ((query: string) => MediaQueryList) | undefined = typeof window === 'undefined'
    ? undefined
    : window.matchMedia?.bind(window)
): boolean {
  if (!matchMediaFn) return false;
  try {
    return matchMediaFn('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

/**
 * An explicit choice always wins over the OS setting; with no explicit choice the OS decides.
 */
export function resolvePreference(
  stored: MotionPreference | null,
  prefersReduced: boolean
): MotionPreference {
  if (stored === 'on' || stored === 'off') return stored;
  return prefersReduced ? 'off' : 'on';
}

export function togglePreference(current: MotionPreference): MotionPreference {
  return current === 'on' ? 'off' : 'on';
}

/** Mirror the preference onto <html data-motion> so CSS can react without a re-render. */
export function applyPreference(root: HTMLElement, preference: MotionPreference): void {
  root.setAttribute('data-motion', preference);
}

export const MOTION_ATTRIBUTE = 'data-motion';
