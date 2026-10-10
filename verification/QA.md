# Verification results

## Executed checks

- `npm test`: 7 test files, 56 tests passed.
- `npm run build`: successful TypeScript and Vite production build. One advisory about the combined animation bundle size remains; this is not a build failure.
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
