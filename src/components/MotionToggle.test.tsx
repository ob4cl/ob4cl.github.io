import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import MotionToggle from './MotionToggle';
import { MotionProvider } from '../lib/useMotion';

function renderToggle() {
  return render(
    <MotionProvider>
      <MotionToggle />
    </MotionProvider>
  );
}

describe('MotionToggle', () => {
  it('starts pressed when nothing is stored', () => {
    renderToggle();
    expect(screen.getByRole('button', { name: /motion/i })).toHaveAttribute('aria-pressed', 'true');
    expect(document.documentElement.getAttribute('data-motion')).toBe('on');
  });

  it('turns motion off, persists the choice and updates the document attribute', async () => {
    const user = userEvent.setup();
    renderToggle();

    await user.click(screen.getByRole('button', { name: /motion/i }));

    const toggle = screen.getByRole('button', { name: /motion/i });
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
    expect(toggle).toHaveTextContent(/off/i);
    expect(window.localStorage.getItem('ob4cl.motion')).toBe('off');
    expect(document.documentElement.getAttribute('data-motion')).toBe('off');
  });

  it('turns motion back on and toggles both ways', async () => {
    const user = userEvent.setup();
    renderToggle();
    const toggle = screen.getByRole('button', { name: /motion/i });

    await user.click(toggle);
    await user.click(toggle);

    expect(toggle).toHaveAttribute('aria-pressed', 'true');
    expect(window.localStorage.getItem('ob4cl.motion')).toBe('on');
    expect(document.documentElement.getAttribute('data-motion')).toBe('on');
  });

  it('respects a stored preference on first render', () => {
    window.localStorage.setItem('ob4cl.motion', 'off');
    renderToggle();
    expect(screen.getByRole('button', { name: /motion/i })).toHaveAttribute('aria-pressed', 'false');
    expect(document.documentElement.getAttribute('data-motion')).toBe('off');
  });

  it('is reachable and operable by keyboard', async () => {
    const user = userEvent.setup();
    renderToggle();

    await user.tab();
    expect(screen.getByRole('button', { name: /motion/i })).toHaveFocus();

    await user.keyboard('{Enter}');
    expect(window.localStorage.getItem('ob4cl.motion')).toBe('off');
  });
});
