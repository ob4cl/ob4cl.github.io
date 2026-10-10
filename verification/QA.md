# Verification results

## Executed checks

- `npm test`: 11 test files, 83 tests passed.
- `npm run build`: successful TypeScript and Vite production build. One advisory about the combined animation bundle size remains; this is not a build failure.
- Interaction coverage added as behavioural component tests against the real components, not just snapshots: `pixel-filter` — the CindR field lights the pixels around the pointer (brightest and largest nearest it), publishes the pointer to CSS, clears and stops when the pointer leaves, and keeps the flat field when no pointer radius is set; `chain-break` — the hero chain is untouched at rest, glyphs inside the field's reach are thrown away from the cursor within the push budget, glyphs outside it are never touched, the chain reassembles and the frame loop stops on pointer leave, and touch input is ignored; `chain-individual` — displaced glyphs fan out in different directions, over different distances, at different speeds.
- Geometry of the break-apart field is separately unit tested for distance falloff, direction, per-glyph sensitivity, bounded magnitude and settling, plus a regression guard that the shipped field stays restrained.
- Audit fixes re-verified against the built bundle: axe-core (1440 and 390, dialog closed and open) **0 violations, 48 rules passing**; 200% text resize with no clipped element and no horizontal overflow; WCAG 1.4.12 text-spacing overrides with no loss of content; the meta CSP in place with no policy violations reported while the gallery renders, its fonts load and its canvases mount.
- Deployed checks after the same commit: canonical, `og:*`, `twitter:*`, JSON-LD, CSP meta and apple-touch-icon present in the served HTML; `robots.txt`, `sitemap.xml`, `og.png` and `apple-touch-icon.png` all served 200; unknown paths return the branded 404; a single `<h1>`; every index numeral 0% covered by a treatment surface and aligned to its text column.
- `npm audit --omit=dev`: 0 known production dependency vulnerabilities reported at verification time.
- Chromium production-bundle runs at widths 320, 390, 768 and 1440: document width equals viewport width, no JavaScript page errors.
- axe WCAG A/AA checks at 320, 390 and 1440: no automated violations. This is not a claim of exhaustive accessibility certification.
- Five project detail panels: open, tab-cycle containment, Escape close and exact opener focus restoration verified in the actual animated browser.
- All five detail dialogs: no automated axe violations in tested desktop state.
- ASCII chain pointer interaction changed the rendered transform.
- Motion toggle disabled animation and persisted through reload.
- Explore-work navigation moved the document to the gallery.
- Standalone `file://` preview: five project panels, self-hosted fonts loaded from embedded assets, zero failed requests and zero JavaScript errors.
- WebGL unavailable simulation: all five panels remained present and the hero used its static fallback.
- Source, public assets and compiled textual files were scanned for the disallowed personal name: no matches.
- Screenshot of the Taunton website checked visually for personal identity before inclusion.

## Evidence

- `responsive-audit.json`: viewport checks, link inventories, image load results, axe results.
- `interaction-results.json`: actual animated interactions and dialog checks.
- `npm-audit.json`: production dependency audit output.
- `screenshots/`: desktop/mobile hero and project screenshots.

Screenshots were taken from the actual build using intercepted local responses in Playwright; no development or preview server was started. Some test-environment warnings about jsdom's unimplemented `window.scrollTo` appear during unit tests; browser navigation was separately verified.

The horizontal project index intentionally scrolls on small screens. Its off-screen buttons are inside its clipping/scrolling container; the page itself has no horizontal overflow.

The site is built and published: the repository is public at https://github.com/ob4cl/ob4cl.github.io and GitHub Pages serves it at https://ob4cl.github.io/ (deployed from `dist/` by `.github/workflows/deploy.yml`).
