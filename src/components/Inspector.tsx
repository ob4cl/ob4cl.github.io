import { useEffect, useRef } from 'react';

import { trapTabKey } from '../lib/focus';
import type { Project } from '../data/projects';

import './inspector.css';

interface InspectorProps {
  project: Project;
  onClose: () => void;
}

/**
 * Project details dialog.
 *
 * Keyboard contract: focus moves into the dialog on open, Tab cycles inside it, Escape closes it,
 * and the caller restores focus to the button that opened it.
 */
export default function Inspector({ project, onClose }: InspectorProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const titleId = `inspector-title-${project.id}`;
  const descriptionId = `inspector-lede-${project.id}`;

  useEffect(() => {
    closeRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== 'Tab') return;
      const root = dialogRef.current;
      if (!root) return;
      if (trapTabKey(root, document.activeElement, event.shiftKey)) {
        event.preventDefault();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div className="inspector" data-inspector>
      <div
        className="inspector__scrim"
        data-inspector-scrim
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className="inspector__dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        ref={dialogRef}
      >
        <div className="inspector__head">
          <div>
            <p className="inspector__kicker">
              <span className="inspector__num">{project.num}</span>
              <span aria-hidden="true"> / </span>
              {project.kicker}
            </p>
            <h2 className="inspector__name" id={titleId}>
              {project.name}
            </h2>
          </div>
          <button
            type="button"
            className="inspector__close"
            onClick={onClose}
            ref={closeRef}
            aria-label={`Close details for ${project.name}`}
          >
            Close
            <span className="inspector__close-key" aria-hidden="true">
              Esc
            </span>
          </button>
        </div>

        <p className="inspector__lede" id={descriptionId}>
          {project.tagline} — {project.lede}
        </p>

        <div className="inspector__body">
          {project.details.map((section) => (
            <section className="inspector__section" key={section.title}>
              <h3 className="inspector__section-title">{section.title}</h3>
              {section.code ? (
                <pre className="inspector__code">
                  <code>{section.code}</code>
                </pre>
              ) : null}
              <ul className="inspector__list">
                {section.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <div className="inspector__foot">
          <dl className="inspector__facts">
            {project.facts.map((fact) => (
              <div key={fact.label}>
                <dt>{fact.label}</dt>
                <dd>{fact.value}</dd>
              </div>
            ))}
          </dl>

          <div className="inspector__links">
            {project.links.map((link) => (
              <a key={link.href} href={link.href} target="_blank" rel="noreferrer noopener">
                {link.label}
                <span aria-hidden="true"> ↗</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
