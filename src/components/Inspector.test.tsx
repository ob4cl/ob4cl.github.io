import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import Inspector from './Inspector';
import { projects } from '../data/projects';
import { getFocusable, trapTabKey } from '../lib/focus';

const project = projects.find((candidate) => candidate.id === 'dependency-risk-radar')!;

function renderInspector(onClose = vi.fn()) {
  const utils = render(<Inspector project={project} onClose={onClose} />);
  return { ...utils, onClose };
}

describe('Inspector dialog', () => {
  it('exposes a labelled modal dialog', () => {
    renderInspector();
    const dialog = screen.getByRole('dialog');

    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby', `inspector-title-${project.id}`);
    expect(dialog).toHaveAttribute('aria-describedby', `inspector-lede-${project.id}`);
    expect(screen.getByRole('heading', { level: 2, name: project.name })).toBeInTheDocument();
  });

  it('moves focus to the close control on open', () => {
    renderInspector();
    expect(screen.getByRole('button', { name: new RegExp(`close details for ${project.name}`, 'i') })).toHaveFocus();
  });

  it('renders every documented detail section, including the code blocks and limits', () => {
    renderInspector();

    for (const section of project.details) {
      expect(screen.getByRole('heading', { level: 3, name: section.title })).toBeInTheDocument();
    }

    expect(screen.getByText(/block_score: 70/)).toBeInTheDocument();
    expect(screen.getByText(/no Python, Rust or Java ecosystems yet/i)).toBeInTheDocument();
    expect(screen.getAllByRole('link').map((link) => link.getAttribute('href'))).toContain(
      'https://github.com/ob4cl/dependency-risk-radar'
    );
  });

  it('marks every external link as safe to open in a new tab', () => {
    renderInspector();
    for (const link of screen.getAllByRole('link')) {
      expect(link).toHaveAttribute('target', '_blank');
      expect(link.getAttribute('rel')).toContain('noreferrer');
      expect(link.getAttribute('rel')).toContain('noopener');
    }
  });

  it('closes on Escape', async () => {
    const user = userEvent.setup();
    const { onClose } = renderInspector();

    await user.keyboard('{Escape}');

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes when the scrim is clicked', async () => {
    const user = userEvent.setup();
    const { onClose, container } = renderInspector();

    const scrim = container.querySelector('[data-inspector-scrim]') as HTMLElement;
    await user.click(scrim);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('keeps Tab inside the dialog', async () => {
    const user = userEvent.setup();
    renderInspector();

    const dialog = screen.getByRole('dialog');
    const focusable = getFocusable(dialog);
    expect(focusable.length).toBeGreaterThanOrEqual(2);

    // Walk all the way round: focus must never escape the dialog.
    for (let i = 0; i < focusable.length + 3; i++) {
      await user.tab();
      expect(dialog.contains(document.activeElement)).toBe(true);
    }

    // Shift+Tab from the first element wraps to the last one.
    focusable[0].focus();
    await user.tab({ shift: true });
    expect(document.activeElement).toBe(focusable[focusable.length - 1]);
  });

  it('trapTabKey reports whether it redirected focus', () => {
    const container = document.createElement('div');
    const first = document.createElement('button');
    const last = document.createElement('a');
    last.href = '#x';
    container.append(first, last);
    document.body.append(container);

    first.focus();
    // Forward tab from a middle/last element inside the container is not ours to handle.
    last.focus();
    expect(trapTabKey(container, last, false)).toBe(true);
    expect(document.activeElement).toBe(first);

    expect(trapTabKey(container, first, true)).toBe(true);
    expect(document.activeElement).toBe(last);

    expect(trapTabKey(container, first, false)).toBe(false);

    container.remove();
  });
});
