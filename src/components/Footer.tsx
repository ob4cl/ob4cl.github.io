import { GITHUB_PROFILE, TAUNTON_URL, projects } from '../data/projects';
import MotionToggle from './MotionToggle';

import './footer.css';

const NOTICES = [
  {
    name: 'React Bits',
    note: 'MIT + Commons Clause v1.0 · © 2026 David Haz',
    href: 'https://github.com/DavidHDev/react-bits'
  },
  { name: 'GSAP', note: 'Standard "no charge" licence · GreenSock / Webflow', href: 'https://gsap.com' },
  { name: 'Lenis', note: 'MIT · darkroom.engineering', href: 'https://github.com/darkroomengineering/lenis' },
  { name: 'ogl', note: 'Unlicense · public domain', href: 'https://github.com/oframe/ogl' },
  { name: 'Motion', note: 'MIT · Motion B.V.', href: 'https://motion.dev' },
  {
    name: 'Typefaces',
    note: 'Bricolage Grotesque, Fraunces, IBM Plex Mono · SIL OFL 1.1',
    href: 'https://fontsource.org'
  }
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer" id="contact">
      <div className="footer__main">
        <div className="footer__callout">
          <p className="footer__eyebrow">elsewhere</p>
          <h2 className="footer__title">
            The code lives on GitHub.
            <br />
            The websites live in Somerset.
          </h2>
          <div className="footer__cta">
            <a className="footer__button" href={GITHUB_PROFILE} target="_blank" rel="noreferrer noopener">
              github.com/ob4cl
              <span aria-hidden="true"> ↗</span>
            </a>
            <a className="footer__button footer__button--ghost" href={TAUNTON_URL} target="_blank" rel="noreferrer noopener">
              tauntonwebco.co.uk
              <span aria-hidden="true"> ↗</span>
            </a>
          </div>
          <p className="footer__policy">
            Independent projects, open source and a small web design studio. Explore the repositories
            to see what I’m building, or visit Taunton Web Co. for website enquiries.
          </p>
        </div>

        <div className="footer__columns">
          <nav className="footer__col" aria-label="Projects">
            <h3 className="footer__col-title">Projects</h3>
            <ul>
              {projects.map((project) => (
                <li key={project.id}>
                  <a href={project.links[0].href} target="_blank" rel="noreferrer noopener">
                    {project.name}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="footer__col">
            <h3 className="footer__col-title">Built-with notices</h3>
            <ul className="footer__notices">
              {NOTICES.map((notice) => (
                <li key={notice.name}>
                  <a href={notice.href} target="_blank" rel="noreferrer noopener">
                    {notice.name}
                  </a>
                  <span>{notice.note}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="footer__col">
            <h3 className="footer__col-title">Preferences</h3>
            <MotionToggle className="motion-toggle--footer" />
            <p className="footer__col-note">
              Animation is opt-out. With motion off, Lenis smooth scrolling and every canvas
              treatment is skipped and the page scrolls natively.
            </p>
          </div>
        </div>
      </div>

      <div className="footer__base">
        <p className="footer__wordmark">ob4cl</p>
        <p className="footer__meta">
          © {year} ob4cl · React + TypeScript + Vite · GSAP + Lenis + React Bits (adapted) ·
          self-hosted fonts
        </p>
        <p className="footer__meta">
          No cookies, no analytics, no third-party requests. Content sourced from each project's own
          README and repository metadata.
        </p>
      </div>
    </footer>
  );
}
