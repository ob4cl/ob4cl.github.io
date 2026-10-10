import { useRef } from 'react';
import { useNearViewport } from '../lib/useNearViewport';
import Treatment from './Treatment';
import VisualBoundary from './VisualBoundary';
import type { Project } from '../data/projects';

import './panel.css';

interface ProjectPanelProps {
  project: Project;
  animated: boolean;
  onOpenDetails: (project: Project, trigger: HTMLButtonElement) => void;
}

/**
 * One project, one editorial panel — not a card. Text column, fact table, links, and its own
 * treatment column. Alternating sides keep the gallery moving horizontally through the page.
 */
export default function ProjectPanel({ project, animated, onOpenDetails }: ProjectPanelProps) {
  const panelRef = useRef<HTMLElement>(null);
  const near = useNearViewport(panelRef);
  const repo = project.links.find((link) => link.kind === 'repo');
  const external = project.links.filter((link) => link.kind !== 'repo');

  return (
    <article
      ref={panelRef}
      className={`panel panel--${project.treatment}`}
      id={project.id}
      data-project={project.id}
      aria-labelledby={`${project.id}-name`}
    >
      <p className="panel__numeral" data-panel-numeral aria-hidden="true">
        {project.num}
      </p>

      <div className="panel__body">
        <p className="panel__kicker">
          <span className="panel__num">{project.num}</span>
          <span className="panel__divider" aria-hidden="true">
            /
          </span>
          {project.kicker}
        </p>

        <h3 className="panel__name" id={`${project.id}-name`}>
          {project.name}
        </h3>

        <p className="panel__tagline">{project.tagline}</p>
        <p className="panel__lede">{project.lede}</p>

        <dl className="panel__facts">
          {project.facts.map((fact) => (
            <div className="panel__fact" key={fact.label}>
              <dt>{fact.label}</dt>
              <dd>{fact.value}</dd>
            </div>
          ))}
        </dl>

        <ul className="panel__badges">
          {project.badges.map((badge) => (
            <li key={badge}>{badge}</li>
          ))}
        </ul>

        <div className="panel__actions">
          {repo ? (
            <a
              className="panel__link panel__link--primary"
              href={repo.href}
              target="_blank"
              rel="noreferrer noopener"
            >
              {repo.label}
              <span aria-hidden="true"> ↗</span>
            </a>
          ) : null}

          {external.map((link) => (
            <a
              className="panel__link"
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noreferrer noopener"
            >
              {link.label}
              <span aria-hidden="true"> ↗</span>
            </a>
          ))}

          <button
            type="button"
            className="panel__link panel__link--details"
            onClick={(event) => onOpenDetails(project, event.currentTarget)}
          >
            Project details
            <span className="panel__details-hint" aria-hidden="true">
              ↵
            </span>
          </button>
        </div>

        <ul className="panel__stack" aria-label={`${project.name} stack`}>
          {project.stack.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>

      <div className="panel__visual" data-panel-visual>
        <VisualBoundary fallback={<Treatment project={project} animated={false} />}>
          <Treatment project={project} animated={animated && near} />
        </VisualBoundary>
      </div>
    </article>
  );
}
