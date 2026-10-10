import './approach.css';

interface Principle {
  title: string;
  body: string;
  proof: string;
}

const PRINCIPLES: Principle[] = [
  {
    title: 'Deterministic before clever',
    body: 'A gate that cannot be reproduced is not a gate. The analysis core answers the same way for the same inputs, and the policy that decides the outcome is a file in the repository — reviewable, versioned, diffable.',
    proof: 'dependency-risk-radar: same refs + same policy = same decision · Forgix: --dry-run preview and a lock file per scaffold.'
  },
  {
    title: 'Local-first, explicit trust boundaries',
    body: 'Data stays where it was created unless exporting is the point. Where a tool has to touch the machine, the boundary is stated and enforced rather than implied.',
    proof: 'CindR: IndexedDB, no accounts, no cloud sync · Forgix: 0600 config, path traversal blocked, sensitive directories refused · modelguard: format handlers that inspect artefacts without executing them.'
  },
  {
    title: 'Limits belong in the README',
    body: 'Every one of these projects publishes what it does not do — JavaScript-only v1 ecosystems, an alpha signature registry, a tracker that will not cancel your subscriptions. The honest version is more useful than the impressive one.',
    proof: 'dependency-risk-radar: pre-1.0, no multi-workspace discovery · modelguard: curated signatures, absence is not proof of safety · CindR: no bank linking, no auto-cancellation.'
  },
  {
    title: 'Motion is optional, accessibility is not',
    body: 'This page animates with GSAP, Lenis smooth scroll and canvas treatments — and it will hold completely still if you or your operating system ask it to. Every canvas is decorative, every control is keyboard reachable, and every detail panel is a labelled dialog.',
    proof: 'Use the Motion control in the header: one click replaces animation with stills and restores native scrolling.'
  }
];

export default function Approach() {
  return (
    <section className="approach" id="approach" aria-labelledby="approach-title">
      <header className="approach__head">
        <p className="approach__eyebrow">the approach</p>
        <h2 className="approach__title" id="approach-title">
          Four rules that survive contact with production
        </h2>
      </header>

      <ol className="approach__list">
        {PRINCIPLES.map((principle, index) => (
          <li className="principle" key={principle.title}>
            <span className="principle__num" aria-hidden="true">
              {String(index + 1).padStart(2, '0')}
            </span>
            <div className="principle__body">
              <h3 className="principle__title">{principle.title}</h3>
              <p className="principle__text">{principle.body}</p>
              <p className="principle__proof">{principle.proof}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
