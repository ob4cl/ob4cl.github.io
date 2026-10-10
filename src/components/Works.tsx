import ScrollFloat from './reactbits/ScrollFloat';
import ScrollVelocity from './reactbits/ScrollVelocity';
import IndexRail from './IndexRail';
import ProjectPanel from './ProjectPanel';
import { MARQUEE_TERMS, projects } from '../data/projects';
import type { Project } from '../data/projects';

import './works.css';

interface WorksProps {
  animated: boolean;
  activeId: string | null;
  onOpenDetails: (project: Project, trigger: HTMLButtonElement) => void;
}

/**
 * The gallery itself: an editorial intro, a velocity band of real stack terms, a persistent index
 * and five full-width panels. This is an "explore" surface — an index plus one project per screen,
 * not a grid of equal cards.
 */
export default function Works({ animated, activeId, onOpenDetails }: WorksProps) {
  return (
    <section className="works" id="works" data-works aria-labelledby="works-title">
      <div className="works__intro">
        <p className="works__eyebrow">the gallery</p>

        {/* Decorative repeat of the section label below, hidden so screen readers hear it once. */}
        <div aria-hidden="true">
          <ScrollFloat
            containerClassName="works__title"
            textClassName="works__title-text"
            enabled={animated}
          >
            Selected work
          </ScrollFloat>
        </div>

        <div className="works__intro-cols">
          <h2 className="visually-hidden" id="works-title">
            Selected work
          </h2>
          <p className="works__intro-text">
            A project starter, a private subscription tracker, two security tools, and my web
            design studio. Open a project to see how it works, or head straight to the source.
          </p>
          <p className="works__intro-meta">
            <span>index 01—05</span>
            <span>4 repositories</span>
            <span>1 studio</span>
          </p>
        </div>
      </div>

      <div className="works__band" aria-hidden="true">
        <ScrollVelocity
          texts={[MARQUEE_TERMS.slice(0, 7).join(' · '), MARQUEE_TERMS.slice(7).join(' · ')]}
          velocity={animated ? 42 : 0}
          numCopies={4}
          enabled={animated}
          damping={60}
          stiffness={300}
        />
      </div>

      <div className="works__grid">
        <IndexRail activeId={activeId} />

        <div className="works__panels">
          {projects.map((project) => (
            <ProjectPanel
              key={project.id}
              project={project}
              animated={animated}
              onOpenDetails={onOpenDetails}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
