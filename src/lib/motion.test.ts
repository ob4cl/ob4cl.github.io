import { describe, expect, it, vi } from 'vitest';

import {
  MOTION_STORAGE_KEY,
  applyPreference,
  persistPreference,
  readStoredPreference,
  resolvePreference,
  safeStorage,
  systemPrefersReducedMotion,
  togglePreference
} from './motion';

function fakeStorage(initial: Record<string, string> = {}): Storage {
  const map = new Map(Object.entries(initial));
  return {
    get length() {
      return map.size;
    },
    clear: () => map.clear(),
    getItem: (key: string) => map.get(key) ?? null,
    key: (index: number) => Array.from(map.keys())[index] ?? null,
    removeItem: (key: string) => void map.delete(key),
    setItem: (key: string, value: string) => void map.set(key, String(value))
  } as Storage;
}

describe('motion preference', () => {
  it('prefers an explicit choice over the operating system setting', () => {
    expect(resolvePreference('on', true)).toBe('on');
    expect(resolvePreference('off', false)).toBe('off');
  });

  it('falls back to the operating system when nothing is stored', () => {
    expect(resolvePreference(null, true)).toBe('off');
    expect(resolvePreference(null, false)).toBe('on');
  });

  it('toggles between the two states', () => {
    expect(togglePreference('on')).toBe('off');
    expect(togglePreference('off')).toBe('on');
  });

  it('round-trips a stored preference and ignores junk values', () => {
    const storage = fakeStorage();
    persistPreference('off', storage);
    expect(storage.getItem(MOTION_STORAGE_KEY)).toBe('off');
    expect(readStoredPreference(storage)).toBe('off');

    storage.setItem(MOTION_STORAGE_KEY, 'maybe');
    expect(readStoredPreference(storage)).toBeNull();

    persistPreference(null, storage);
    expect(storage.getItem(MOTION_STORAGE_KEY)).toBeNull();
  });

  it('survives a storage implementation that throws', () => {
    const hostile = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
      removeItem: () => {
        throw new Error('blocked');
      }
    } as unknown as Storage;

    expect(readStoredPreference(hostile)).toBeNull();
    expect(() => persistPreference('on', hostile)).not.toThrow();
  });

  it('reads the OS preference through matchMedia', () => {
    const matchMedia = vi.fn(() => ({ matches: true }) as MediaQueryList);
    expect(systemPrefersReducedMotion(matchMedia)).toBe(true);

    const throwing = vi.fn(() => {
      throw new Error('no matchMedia');
    });
    expect(systemPrefersReducedMotion(throwing)).toBe(false);
    expect(systemPrefersReducedMotion(undefined)).toBe(false);
  });

  it('mirrors the preference onto the document element', () => {
    applyPreference(document.documentElement, 'off');
    expect(document.documentElement.getAttribute('data-motion')).toBe('off');
    applyPreference(document.documentElement, 'on');
    expect(document.documentElement.getAttribute('data-motion')).toBe('on');
  });

  it('exposes the browser storage when available', () => {
    expect(safeStorage()).toBe(window.localStorage);
  });
});
