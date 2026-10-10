import { useEffect, useState } from 'react';
import type { MouseEvent } from 'react';

import { GITHUB_PROFILE, projects } from '../data/projects';
import { scrollToId } from '../lib/lenis';
import MotionToggle from './MotionToggle';
import AsciiChain from './AsciiChain';

import './header.css';

const NAV = [
  { id: 'works', label: 'Work' },
  { id: 'approach', label: 'Approach' },
  { id: 'contact', label: 'Contact' }
];

export default function Header() {
  const [condensed, setCondensed] = useState(false);

  useEffect(() => {
    const onScroll = () => setCondensed(window.scrollY > 64);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const jump = (event: MouseEvent<HTMLAnchorElement>, id: string) => {
    event.preventDefault();
    scrollToId(id, { offset: -8 });
  };

  return (
    <header className={`site-header${condensed ? ' is-condensed' : ''}`}>
      <a className="site-header__brand" href="#top" onClick={(event) => jump(event, 'top')}>
        <AsciiChain compact />
        <span className="site-header__brand-mark">ob4cl</span>
      </a>

      <nav className="site-header__nav" aria-label="Sections">
        <ul>
          {NAV.map((item) => (
            <li key={item.id}>
              <a href={`#${item.id}`} onClick={(event) => jump(event, item.id)}>
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="site-header__tools">
        <MotionToggle />
        <a
          className="site-header__gh"
          aria-label="ob4cl on GitHub (opens a new tab)"
          href={GITHUB_PROFILE}
          target="_blank"
          rel="noreferrer noopener"
        >
          <span className="site-header__gh-label">GitHub</span>
          <span aria-hidden="true"> ↗</span>
        </a>
      </div>

      <span className="visually-hidden">
        This gallery presents {projects.length} selected projects.
      </span>
    </header>
  );
}
