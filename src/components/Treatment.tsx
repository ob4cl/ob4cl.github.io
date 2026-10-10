/**
 * Project treatments.
 *
 * Each of the four repositories gets its own visual language rather than a shared card template:
 * a scanned terminal for Forgix, a local-first data diagram for CindR, a radar sweep for
 * dependency-risk-radar and a rule map for modelguard. Taunton Web Co. gets a studio panel.
 *
 * Every canvas is decorative: it is `aria-hidden` and every fact it hints at is also present as
 * real text in the panel body or the inspector.
 */

import FaultyTerminal from './reactbits/FaultyTerminal';
import PixelCard from './reactbits/PixelCard';
import Radar from './reactbits/Radar';
import SpotlightCard from './reactbits/SpotlightCard';
import GlareHover from './reactbits/GlareHover';
import type { ReactElement } from 'react';
import type { Project, Treatment as TreatmentKind } from '../data/projects';

import './treatment.css';

interface TreatmentProps {
  project: Project;
  /** Animation allowed? When false, canvases are replaced by still variants. */
  animated: boolean;
}

/* -------------------------------------------------------------------------------------------- */
/* Forgix — scanned terminal                                                                     */
/* -------------------------------------------------------------------------------------------- */

function TerminalTreatment({ animated }: TreatmentProps) {
  return (
    <div className="treatment treatment--terminal">
      <div className="treatment__surface" aria-hidden="true">
        {animated ? (
          <FaultyTerminal
            scale={1.1}
            gridMul={[2, 1]}
            digitSize={1.35}
            timeScale={0.35}
            scanlineIntensity={0.28}
            glitchAmount={0.85}
            flickerAmount={0.7}
            noiseAmp={0.9}
            curvature={0.16}
            tint="#d8ff3e"
            brightness={0.92}
            mouseReact
            mouseStrength={0.25}
            pageLoadAnimation
          />
        ) : (
          <div className="treatment__terminal-still" />
        )}
      </div>

      <figure className="treatment__snippet treatment__snippet--terminal">
        <pre tabIndex={0} aria-label="Forgix command preview">
          <code>{`$ npx @fourlinx/forgix create my-app -t react-vite --ts --ci
    Preview — files that would be created/modified:

    src/
    + src/index.ts 1.2KB
    + src/App.tsx 0.8KB
    + package.json 0.5KB

    Summary:
      + 15 files to create
      3 directories
      Total: 12.4KB`}</code>
        </pre>
        <figcaption>Dry-run preview as documented in the Forgix README.</figcaption>
      </figure>
    </div>
  );
}

/* -------------------------------------------------------------------------------------------- */
/* CindR — local-first data diagram                                                              */
/* -------------------------------------------------------------------------------------------- */

function PrivacyTreatment({ animated }: TreatmentProps) {
  return (
    <div className="treatment treatment--privacy">
      <div className="treatment__pixel-wrap" aria-hidden="true">
        <PixelCard
          variant="default"
          gap={7}
          speed={animated ? 26 : 0}
          colors="#d8ff3e,#a9cc2b,#c9f06a"
          noFocus
          pointerRadius={170}
          className="treatment__pixel"
        >
          <span className="localflow__spot" />
          <div className="localflow">
            <div className="localflow__node localflow__node--browser">
              <span className="localflow__label">your browser</span>
              <span className="localflow__sub">React 19 · IndexedDB</span>
            </div>
            <div className="localflow__wire">
              <span className="localflow__token">JSON export</span>
            </div>
            <div className="localflow__node localflow__node--device">
              <span className="localflow__label">this device only</span>
              <span className="localflow__sub">installable PWA</span>
            </div>
            <div className="localflow__ghost">
              <span className="localflow__label">cloud sync</span>
              <span className="localflow__strike">not built</span>
            </div>
          </div>
        </PixelCard>
      </div>

      <p className="treatment__caption">
        No server, no account, no tracking — CindR ships as a browser-only app that also builds to
        Android, iOS and Windows.
      </p>

      <p className="treatment__hint">Move the cursor: the field follows it.</p>
    </div>
  );
}

/* -------------------------------------------------------------------------------------------- */
/* dependency-risk-radar — sweep + decision ladder                                               */
/* -------------------------------------------------------------------------------------------- */

const DECISIONS = [
  { id: 'pass', label: 'pass', note: 'safe to proceed under policy', tone: 'pass' },
  { id: 'warn', label: 'warn', note: 'merge allowed, reviewer attention', tone: 'medium' },
  { id: 'high-risk', label: 'high-risk', note: 'explicit approval / escalation', tone: 'high' },
  { id: 'fail', label: 'fail', note: 'blocked by policy or critical', tone: 'critical' }
] as const;

function RadarTreatment({ animated }: TreatmentProps) {
  return (
    <div className="treatment treatment--radar">
      <div className="treatment__surface treatment__surface--radar" aria-hidden="true">
        {animated ? (
          <Radar
            speed={1.1}
            scale={0.62}
            ringCount={9}
            spokeCount={12}
            ringThickness={0.045}
            spokeThickness={0.008}
            sweepSpeed={1.05}
            sweepWidth={2.4}
            color="#d8ff3e"
            backgroundColor="#0a0b09"
            brightness={1.15}
            falloff={2.1}
            mouseInfluence={0.08}
          />
        ) : (
          <div className="treatment__radar-still" />
        )}
      </div>

      <ul className="ladder">
        {DECISIONS.map((decision) => (
          <li key={decision.id} className={`ladder__row ladder__row--${decision.tone}`}>
            <span className="ladder__dot" aria-hidden="true" />
            <span className="ladder__label">{decision.label}</span>
            <span className="ladder__note">{decision.note}</span>
          </li>
        ))}
      </ul>
      <p className="treatment__caption">
        Four documented outcomes, produced by the same refs and policy every time.
      </p>
    </div>
  );
}

/* -------------------------------------------------------------------------------------------- */
/* modelguard — rule map                                                                         */
/* -------------------------------------------------------------------------------------------- */

/** Deterministic decorative pattern (fixed seed — no randomness between renders). */
function ruleMapCells(): Array<{ x: number; y: number; tone: string }> {
  let seed = 20240401;
  const next = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
  const cells: Array<{ x: number; y: number; tone: string }> = [];
  for (let row = 0; row < 12; row++) {
    for (let col = 0; col < 18; col++) {
      const r = next();
      const tone =
        r > 0.985 ? 'critical' : r > 0.955 ? 'high' : r > 0.9 ? 'medium' : r > 0.8 ? 'low' : 'idle';
      cells.push({ x: col, y: row, tone });
    }
  }
  return cells;
}

const RULE_MAP = ruleMapCells();

const FLAGGED_RULES = [
  { id: 'MG-WEIGHT-002', severity: 'critical', what: 'NaN / Inf values in tensors' },
  { id: 'MG-WEIGHT-006', severity: 'high', what: 'anomalous embedding vectors' },
  { id: 'MG-2024-0005', severity: 'critical', what: 'malicious pickle payload (RCE)' }
] as const;

function WeightsTreatment({ animated }: TreatmentProps) {
  return (
    <div className="treatment treatment--weights">
      <GlareHover
        width="100%"
        height="auto"
        background="transparent"
        borderColor="rgba(242,239,228,0.18)"
        borderRadius="18px"
        glareColor="#d8ff3e"
        glareOpacity={0.24}
        glareAngle={-32}
        glareSize={220}
        className="treatment__glare"
      >
        <div className="weights" aria-hidden="true">
          <div className="weights__grid">
            {RULE_MAP.map((cell) => (
              <span
                key={`${cell.x}-${cell.y}`}
                className={`weights__cell weights__cell--${cell.tone}`}
                style={{ animationDelay: animated ? `${(cell.x * 0.08 + cell.y * 0.05).toFixed(2)}s` : undefined }}
              />
            ))}
          </div>
          <div className="weights__legend">
            <span className="chip chip--critical">critical</span>
            <span className="chip chip--high">high</span>
            <span className="chip chip--medium">medium</span>
            <span className="chip chip--low">low</span>
          </div>
        </div>
      </GlareHover>

      <ul className="rulelist">
        {FLAGGED_RULES.map((rule) => (
          <li key={rule.id} className="rulelist__row">
            <code className="rulelist__id">{rule.id}</code>
            <span className={`chip chip--${rule.severity}`}>{rule.severity}</span>
            <span className="rulelist__what">{rule.what}</span>
          </li>
        ))}
      </ul>
      <p className="treatment__caption">
        A map of ModelGuard's documented severities, not a measurement of any model.
      </p>
    </div>
  );
}

/* -------------------------------------------------------------------------------------------- */
/* Taunton Web Co. — studio panel                                                                */
/* -------------------------------------------------------------------------------------------- */

function StudioTreatment({ project, animated }: TreatmentProps) {
  return (
    <div className="treatment treatment--studio">
      <SpotlightCard
        className="studio"
        spotlightColor="#d8ff3e"
        intensity={0.16}
        spotlightSize={320}
        softness={0.62}
        proximity={120}
        ambient={animated}
        grain={0.3}
      >
        <a className="studio__preview" href={project.links[0].href} target="_blank" rel="noreferrer noopener" aria-label="View the Taunton Web Co. website (opens a new tab)">
          <span className="studio__browser" aria-hidden="true"><i /><i /><i /><span>tauntonwebco.co.uk</span></span>
          <img src="/images/taunton-webco.webp" alt="The Taunton Web Co. homepage, featuring its web design service and Somerset landscape" width="1080" height="750" loading="lazy" decoding="async" />
        </a>
        <p className="studio__eyebrow">Independent web design · Taunton, Somerset</p>
        <p className="studio__lede">
          Small business. Standout website. Every plan starts with a free homepage mock-up — you pay
          once you are happy with it.
        </p>
        <ul className="studio__plans">
          {['Kickstart', 'Kickstart + Care', 'Custom'].map((plan) => (
            <li key={plan} className="studio__plan">
              <span className="studio__plan-name">{plan}</span>
            </li>
          ))}
        </ul>
        <a
          className="studio__link"
          href={project.links[0].href}
          target="_blank"
          rel="noreferrer noopener"
        >
          tauntonwebco.co.uk
          <span aria-hidden="true"> ↗</span>
        </a>
        <p className="studio__note">
          Visit the studio for web design, maintenance and current packages.
        </p>
      </SpotlightCard>
    </div>
  );
}

const TREATMENTS: Record<TreatmentKind, (props: TreatmentProps) => ReactElement> = {
  terminal: TerminalTreatment,
  privacy: PrivacyTreatment,
  radar: RadarTreatment,
  weights: WeightsTreatment,
  studio: StudioTreatment
};

export default function Treatment(props: TreatmentProps) {
  const Component = TREATMENTS[props.project.treatment];
  return <Component {...props} />;
}
