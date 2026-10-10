import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

// The ogl/canvas treatments need WebGL, which jsdom does not implement. They are covered by real
// browser renders instead (see README: verification), so here they are stubbed out.
vi.mock('./lib/useNearViewport', () => ({ useNearViewport: () => true }));
vi.mock('./components/reactbits/Particles', () => ({ default: () => <div data-testid="particles" /> }));
vi.mock('./components/reactbits/FaultyTerminal', () => ({ default: () => <div data-testid="terminal" /> }));
vi.mock('./components/reactbits/Radar', () => ({ default: () => <div data-testid="radar" /> }));
vi.mock('./components/reactbits/PixelCard', () => ({
  default: ({ children }: { children?: ReactNode }) => <div data-testid="pixel-card">{children}</div>
}));

import App from './App';
import { MotionProvider } from './lib/useMotion';

function renderApp() {
  return render(
    <MotionProvider>
      <App />
    </MotionProvider>
  );
}

describe('portfolio shell', () => {
  it('renders one accessible heading for the wordmark and five project panels', () => {
    renderApp();

    expect(
      screen.getByRole('heading', { level: 1, name: /ob4cl — developer tooling/i })
    ).toBeInTheDocument();

    const panels = screen.getAllByRole('article');
    expect(panels).toHaveLength(5);
    expect(panels.map((panel) => panel.id)).toEqual([
      'forgix',
      'cindr',
      'dependency-risk-radar',
      'modelguard',
      'taunton-web-co'
    ]);
  });

  it('offers a working project index that points at every panel', () => {
    renderApp();

    const nav = screen.getByRole('navigation', { name: /project index/i });
    const buttons = within(nav).getAllByRole('button');
    expect(buttons).toHaveLength(5);
    expect(buttons[0]).toHaveTextContent('01');
    expect(buttons[4]).toHaveTextContent('Taunton Web Co.');
  });

  it('exposes a skip link and the section navigation', () => {
    renderApp();

    expect(screen.getByRole('link', { name: /skip to the work/i })).toHaveAttribute('href', '#works');
    const sections = screen.getByRole('navigation', { name: /sections/i });
    expect(within(sections).getByRole('link', { name: 'Approach' })).toHaveAttribute('href', '#approach');
  });

  it('links every real project destination from the panels', () => {
    renderApp();

    const hrefs = screen
      .getAllByRole('link')
      .map((link) => link.getAttribute('href') ?? '')
      .filter((href) => href.startsWith('https://'));

    expect(hrefs).toContain('https://github.com/ob4cl/Forgix');
    expect(hrefs).toContain('https://github.com/ob4cl/CindR');
    expect(hrefs).toContain('https://github.com/ob4cl/dependency-risk-radar');
    expect(hrefs).toContain('https://github.com/ob4cl/modelguard');
    expect(hrefs).toContain('https://tauntonwebco.co.uk');
  });

  it('opens the details dialog from a panel and returns focus when it closes', async () => {
    const user = userEvent.setup();
    renderApp();

    const detailsButtons = screen.getAllByRole('button', { name: /project details/i });
    const first = detailsButtons[0];
    await user.click(first);

    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByRole('heading', { level: 2, name: 'Forgix' })).toBeInTheDocument();

    await user.keyboard('{Escape}');

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await vi.waitFor(() => expect(first).toHaveFocus());
  });

  it('renders still (non-canvas) alternatives once motion is turned off', async () => {
    const user = userEvent.setup();
    renderApp();

    expect(screen.getByTestId('particles')).toBeInTheDocument();

    const [headerToggle] = screen.getAllByRole('button', { name: /motion/i });
    await user.click(headerToggle);

    expect(screen.queryByTestId('particles')).not.toBeInTheDocument();
    expect(screen.queryByTestId('terminal')).not.toBeInTheDocument();
    expect(screen.queryByTestId('radar')).not.toBeInTheDocument();
    expect(document.documentElement.getAttribute('data-motion')).toBe('off');
  });

  it('provides the portfolio contact direction in the footer', () => {
    renderApp();
    expect(screen.getByText(/Independent projects, open source/i)).toBeInTheDocument();
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });
});
