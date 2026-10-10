import { describe, expect, it } from 'vitest';

import {
  GITHUB_PROFILE,
  GITHUB_PROJECT_IDS,
  MARQUEE_TERMS,
  TAUNTON_URL,
  projects
} from './projects';

const EXPECTED_ORDER = ['Forgix', 'CindR', 'dependency-risk-radar', 'modelguard', 'Taunton Web Co.'];

describe('project dataset', () => {
  it('contains exactly the four ob4cl repositories plus Taunton Web Co.', () => {
    expect(projects).toHaveLength(5);
    expect(projects.map((project) => project.name)).toEqual(EXPECTED_ORDER);
    expect(GITHUB_PROJECT_IDS).toHaveLength(4);
  });

  it('gives every project a unique id and a sequential index number', () => {
    const ids = projects.map((project) => project.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(projects.map((project) => project.num)).toEqual(['01', '02', '03', '04', '05']);
  });

  it('links each featured repository to github.com/ob4cl/<repo>', () => {
    for (const project of projects) {
      const repo = project.links.find((link) => link.kind === 'repo');
      if (!repo) continue;
      expect(repo.href).toBe(`https://github.com/ob4cl/${project.name}`);
    }
  });

  it('exposes the real external links only', () => {
    const hrefs = projects.flatMap((project) => project.links.map((link) => link.href));
    expect(hrefs).toContain('https://github.com/ob4cl/Forgix');
    expect(hrefs).toContain('https://github.com/ob4cl/CindR');
    expect(hrefs).toContain('https://github.com/ob4cl/dependency-risk-radar');
    expect(hrefs).toContain('https://github.com/ob4cl/modelguard');
    expect(hrefs).toContain(TAUNTON_URL);
    // the live CindR deployment (published in the repository's own README)
    expect(hrefs).toContain('https://silver-narwhal-35c66e.netlify.app');
    expect(GITHUB_PROFILE).toBe('https://github.com/ob4cl');
  });

  it('keeps every link absolute, https and free of tracking parameters', () => {
    for (const project of projects) {
      for (const link of project.links) {
        expect(link.href.startsWith('https://')).toBe(true);
        expect(link.href).not.toMatch(/[?&](utm_|ref=|fbclid)/);
      }
    }
  });

  it('has complete copy for every panel and inspector section', () => {
    for (const project of projects) {
      expect(project.tagline.length).toBeGreaterThan(10);
      expect(project.lede.length).toBeGreaterThan(40);
      expect(project.facts.length).toBeGreaterThanOrEqual(4);
      expect(project.stack.length).toBeGreaterThanOrEqual(3);
      expect(project.badges.length).toBeGreaterThanOrEqual(1);
      expect(project.details.length).toBeGreaterThanOrEqual(3);
      for (const section of project.details) {
        expect(section.title.length).toBeGreaterThan(3);
        expect(section.items.length).toBeGreaterThanOrEqual(1);
        for (const item of section.items) expect(item.trim().length).toBeGreaterThan(10);
      }
    }
  });

  it('documents a limitation for every repository it features', () => {
    for (const id of GITHUB_PROJECT_IDS) {
      const project = projects.find((candidate) => candidate.id === id);
      expect(project).toBeDefined();
      const titles = project!.details.map((section) => section.title.toLowerCase());
      expect(titles.some((title) => title.includes('limitation'))).toBe(true);
    }
  });

  it('covers all five treatment types exactly once', () => {
    const treatments = projects.map((project) => project.treatment);
    expect(new Set(treatments).size).toBe(treatments.length);
  });

  it('never asserts adoption, growth or popularity metrics for the ob4cl projects', () => {
    // Fabricated-metric guard. The four repositories carry no numeric performance claims;
    // Taunton Web Co. is a third party with its own published offers, so it is excluded.
    const githubOnly = projects.filter((project) =>
      (GITHUB_PROJECT_IDS as readonly string[]).includes(project.id)
    );
    const haystack = JSON.stringify(githubOnly);
    const forbidden =
      /\b\d[\d,.]*\+?\s*(users?|stars?|downloads?|installs?|installs per|countries|customers?|companies|developers|teams|repos(?:itories)?|million|thousand|k\b)/gi;
    expect(haystack.match(forbidden)).toBeNull();
  });

  it('keeps the velocity band terms grounded in the documented stacks', () => {
    const stacks = projects.flatMap((project) => project.stack.map((item) => item.toLowerCase()));
    for (const term of MARQUEE_TERMS) {
      const grounded = stacks.some((entry) => entry.includes(term.toLowerCase()));
      expect(grounded, `"${term}" should appear in a project stack`).toBe(true);
    }
  });
});
