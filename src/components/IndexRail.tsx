import { projects } from '../data/projects';
import { scrollToId } from '../lib/lenis';

import './rail.css';

interface IndexRailProps {
  activeId: string | null;
}

/**
 * The gallery index. A real navigation landmark: five buttons that scroll to their project and
 * advertise which one is currently on screen via `aria-current`. It is keyboard operable in both
 * its desktop (vertical, sticky) and mobile (horizontal strip) forms.
 */
export default function IndexRail({ activeId }: IndexRailProps) {
  return (
    <nav className="rail" aria-label="Project index">
      <p className="rail__title">Index</p>

      <div className="rail__track" aria-hidden="true">
        <span className="rail__progress" data-rail-progress />
      </div>

      <ol className="rail__list">
        {projects.map((project) => {
          const current = activeId === project.id;
          return (
            <li key={project.id}>
              <button
                type="button"
                className={`rail__item${current ? ' is-current' : ''}`}
                aria-current={current ? 'true' : undefined}
                onClick={() => scrollToId(project.id, { offset: -72 })}
              >
                <span className="rail__num">{project.num}</span>
                <span className="rail__name">{project.name}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
