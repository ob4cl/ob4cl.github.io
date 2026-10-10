import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import necklace from '../assets/chain-hero.txt?raw';
import mark from '../assets/chain-mark.txt?raw';
import './ascii-chain.css';

/** Original procedural ASCII artwork created for ob4cl, not a third-party logo. */
export default function AsciiChain({ compact = false, animated = false }: { compact?: boolean; animated?: boolean }) {
  const frame = useRef<HTMLDivElement>(null);
  const artwork = useRef<HTMLPreElement>(null);

  useEffect(() => {
    if (compact || !animated || !frame.current || !artwork.current) return;
    const element = frame.current;
    const art = artwork.current;
    const ctx = gsap.context(() => {
      const xTo = gsap.quickTo(art, 'rotationY', { duration: 0.85, ease: 'power3.out' });
      const yTo = gsap.quickTo(art, 'rotationX', { duration: 0.85, ease: 'power3.out' });
      const onMove = (event: PointerEvent) => {
        if (event.pointerType === 'touch') return;
        const bounds = element.getBoundingClientRect();
        xTo(((event.clientX - bounds.left) / bounds.width - 0.5) * 26);
        yTo(-((event.clientY - bounds.top) / bounds.height - 0.5) * 20);
      };
      const onLeave = () => { xTo(0); yTo(0); };
      element.addEventListener('pointermove', onMove);
      element.addEventListener('pointerleave', onLeave);
      return () => {
        element.removeEventListener('pointermove', onMove);
        element.removeEventListener('pointerleave', onLeave);
      };
    }, element);
    return () => ctx.revert();
  }, [compact, animated]);

  if (compact) return <span className="ascii-chain-mark" aria-hidden="true"><pre>{mark}</pre></span>;
  return (
    <div ref={frame} className={`ascii-chain${animated ? ' is-live' : ''}`} role="img" aria-label="ob4cl signature: an original ASCII Cuban-link chain">
      <span className="ascii-chain__coordinate" aria-hidden="true">FIG. 001 / IDENTITY</span>
      <div className="ascii-chain__art" aria-hidden="true">
        <pre ref={artwork}>{necklace}</pre>
        <span className="ascii-chain__center">INDEPENDENT<br /><b>BY DESIGN.</b><i>ob4cl</i></span>
      </div>
      <span className="ascii-chain__caption" aria-hidden="true"><span>CUBAN LINK / ASCII</span><span>{animated ? 'MOVE TO EXPLORE ↗' : 'SIGNATURE MARK'}</span></span>
    </div>
  );
}
