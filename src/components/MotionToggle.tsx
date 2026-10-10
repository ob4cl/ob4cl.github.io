import { useMotion } from '../lib/useMotion';

import './motion-toggle.css';

/**
 * Motion toggle. A real toggle button: `aria-pressed` carries the state, the visible label says
 * which state that is, and the choice is remembered for the next visit.
 */
export default function MotionToggle({ className = '' }: { className?: string }) {
  const { motion, explicit, toggleMotion } = useMotion();
  const on = motion === 'on';

  return (
    <button
      type="button"
      className={`motion-toggle ${className}`.trim()}
      aria-pressed={on}
      onClick={toggleMotion}
      title={
        explicit
          ? 'Your saved preference for this site'
          : 'Following your system reduced-motion setting'
      }
    >
      <span className="motion-toggle__track" aria-hidden="true">
        <span className="motion-toggle__knob" />
      </span>
      <span className="motion-toggle__label">
        Motion
        <span className="motion-toggle__state">{on ? 'on' : 'off'}</span>
      </span>
    </button>
  );
}
