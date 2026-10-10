import { useRef, type MouseEvent } from 'react';
import { useNearViewport } from '../lib/useNearViewport';
import Particles from './reactbits/Particles';
import TextPressure from './reactbits/TextPressure';
import AsciiChain from './AsciiChain';
import VisualBoundary from './VisualBoundary';
import { scrollToId } from '../lib/lenis';
import { projects } from '../data/projects';
import './hero.css';

const DISCIPLINES = ['developer tooling', 'supply-chain security', 'ML security', 'privacy-first apps', 'web design'];

export default function Hero({ animated }: { animated: boolean }) {
  const heroRef = useRef<HTMLElement>(null);
  const near = useNearViewport(heroRef);
  const jump = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    scrollToId('works', { offset: -8 });
  };
  return (
    <section ref={heroRef} className="hero" id="top" data-hero aria-labelledby="hero-title">
      <div className="hero__field" aria-hidden="true">
        <VisualBoundary fallback={<div className="hero__field-still" />}>
        {animated && near ? <Particles particleCount={80} particleSpread={11} speed={0.045} particleColors={['#d8ff3e', '#f2efe4', '#6f7a3a']} particleBaseSize={60} sizeRandomness={1} alphaParticles moveParticlesOnHover particleHoverFactor={0.6} cameraDistance={22} pixelRatio={Math.min(typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1, 1.5)} /> : <div className="hero__field-still" />}
        </VisualBoundary>
      </div>
      <div className="hero__inner" data-hero-inner>
        <p className="hero__eyebrow"><span className="hero__eyebrow-dot" aria-hidden="true" /> independent developer / selected work</p>
        <h1 id="hero-title" className="visually-hidden">ob4cl — developer tooling, security infrastructure and local web design</h1>
        <div className="hero__identity">
          <div className="hero__identity-copy">
            <div className="hero__wordmark" aria-hidden="true">
              {animated && near ? <TextPressure text="ob4cl" fontFamily="'Bricolage Grotesque Variable', system-ui, sans-serif" textColor="#f2efe4" width weight italic={false} alpha={false} flex minFontSize={56} decorative /> : <span className="hero__static-word">ob4cl</span>}
            </div>
            <p className="hero__tagline">Curiosity.<br />Made <em>functional.</em></p>
            <p className="hero__statement">I build developer tools, security experiments and websites. This is a collection of the things I’ve made.</p>
            <a className="hero__explore" href="#works" onClick={jump}>Explore the work <span aria-hidden="true">↘</span></a>
          </div>
          <AsciiChain animated={animated} />
        </div>
        <div className="hero__columns">
          <p className="hero__collection-label">FOUR REPOSITORIES.<br /><span>ONE INDEPENDENT STUDIO.</span></p>
          <ul className="hero__disciplines">{DISCIPLINES.map(line => <li key={line}>{line}</li>)}</ul>
        </div>
        <div className="hero__foot">
          <a className="hero__cue" href="#works" onClick={jump}><span className="hero__cue-line" aria-hidden="true" />Scroll to the work<span className="visually-hidden">{` (${projects.length} projects: ${projects.map(p => p.name).join(', ')})`}</span></a>
          <p className="hero__stamp">BUILT TO BE EXPLORED<span className="hero__stamp-sep" aria-hidden="true">/</span>01—05</p>
        </div>
      </div>
    </section>
  );
}
