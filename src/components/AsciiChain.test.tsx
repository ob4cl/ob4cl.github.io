import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import AsciiChain from './AsciiChain';

/**
 * The real artwork through the component: the split has to leave the chain's exact shape intact,
 * which is the one thing a small stand-in artwork cannot prove. Pointer behaviour lives in
 * AsciiChain.field.test.tsx, which mocks in a small artwork so it can pump frames quickly.
 */
vi.setConfig({ testTimeout: 30000 });

describe('AsciiChain artwork', () => {
  it('splits the artwork into one box per visible glyph, leaving spaces and newlines as text', () => {
    const { container } = render(<AsciiChain animated />);
    const art = container.querySelector('.ascii-chain__art pre');
    expect(art).not.toBeNull();

    const glyphs = container.querySelectorAll('.chain-glyph');
    expect(glyphs.length).toBeGreaterThan(1000);
    for (const glyph of Array.from(glyphs).slice(0, 200)) {
      expect(glyph.textContent?.length).toBe(1);
      expect(glyph.textContent).not.toBe(' ');
    }
    // Spaces are not boxed, so there are fewer boxes than characters...
    expect(glyphs.length).toBeLessThan(art?.textContent?.length ?? 0);
    // ...and the artwork keeps its 50 lines either way.
    expect(art?.textContent?.split('\n').length).toBe(50);
  });

  it('renders nothing movable until the pointer arrives', () => {
    const { container } = render(<AsciiChain animated />);
    const moved = Array.from(container.querySelectorAll('.chain-glyph')).filter(
      (glyph) => (glyph as HTMLElement).style.transform
    );
    expect(moved.length).toBe(0);
  });

  it('renders the compact mark without splitting anything', () => {
    const { container } = render(<AsciiChain compact />);
    expect(container.querySelector('.chain-glyph')).toBeNull();
    expect(container.querySelector('.ascii-chain-mark')).not.toBeNull();
  });
});
