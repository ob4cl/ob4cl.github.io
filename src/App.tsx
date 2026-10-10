import { useCallback, useEffect, useRef, useState } from 'react';

import Approach from './components/Approach';
import Footer from './components/Footer';
import Header from './components/Header';
import Hero from './components/Hero';
import Inspector from './components/Inspector';
import Works from './components/Works';
import type { Project } from './data/projects';
import { setScrollLocked, useSmoothScroll } from './lib/lenis';
import { useScrollChoreography } from './lib/scrollChoreography';
import { useMotion } from './lib/useMotion';

import './app.css';

interface OpenState {
  project: Project;
  trigger: HTMLButtonElement | null;
}

export default function App() {
  const rootRef = useRef<HTMLDivElement>(null);
  const { motion } = useMotion();
  const animated = motion === 'on';

  const [activeId, setActiveId] = useState<string | null>(null);
  const [open, setOpen] = useState<OpenState | null>(null);

  // Smooth scrolling only exists when motion is allowed.
  useSmoothScroll(animated);

  const handleActiveProject = useCallback((id: string | null) => setActiveId(id), []);
  useScrollChoreography({
    rootRef,
    enabled: animated,
    onActiveProject: handleActiveProject
  });

  const openDetails = useCallback((project: Project, trigger: HTMLButtonElement) => {
    setOpen({ project, trigger });
  }, []);

  const closeDetails = useCallback(() => {
    setOpen((current) => {
      const trigger = current?.trigger ?? null;
      // Return focus to whatever opened the dialog.
      requestAnimationFrame(() => trigger?.focus());
      return null;
    });
  }, []);

  useEffect(() => {
    setScrollLocked(open !== null);
    return () => setScrollLocked(false);
  }, [open]);

  return (
    <div className="app" ref={rootRef}>
      <a className="skip-link" href="#works">
        Skip to the work
      </a>

      <Header />

      <main id="main">
        <Hero animated={animated} />
        <Works animated={animated && !open} activeId={activeId} onOpenDetails={openDetails} />
        <Approach />
      </main>

      <Footer />

      {open ? <Inspector project={open.project} onClose={closeDetails} /> : null}
    </div>
  );
}
