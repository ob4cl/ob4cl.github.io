# ob4cl portfolio

A React + TypeScript portfolio featuring exactly Forgix, CindR, dependency-risk-radar, modelguard and Taunton Web Co. Identity is ob4cl only.

## Open it immediately

Open `preview.html` in a modern browser. It is a self-contained preview with embedded JavaScript, styles, fonts and the Taunton screenshot; no server or installation is required. The deployable site is in `dist/`.

## Develop and build

Dependencies are already installed. For a clean checkout, use `npm ci`.

- `npm run dev` — start the development server yourself.
- `npm run typecheck` — TypeScript checks.
- `npm test` — 56 unit/component/content tests.
- `npm run build` — typecheck and create `dist/`.
- `node scripts/make-preview.mjs` — regenerate the standalone preview after building.

No dev, preview or static server was started during construction. Production output was browser-tested using Playwright request interception mapped directly to `dist/`.

## Implementation

- GSAP/ScrollTrigger scroll choreography, active project index and pointer-reactive ASCII chain.
- Lenis smooth scrolling, with native scrolling when motion is disabled.
- Adapted React Bits: Particles, TextPressure, FaultyTerminal, Radar, PixelCard, SpotlightCard, GlareHover, ScrollFloat and ScrollVelocity.
- Original procedurally rendered ASCII Cuban-link necklace and compact chain mark in `src/assets/`.
- Self-hosted Bricolage Grotesque, Fraunces and IBM Plex Mono.
- Five project-detail dialogs with Escape, keyboard focus trapping and focus restoration.
- System reduced-motion support plus a persisted motion preference.
- Expensive canvas effects mount only near the viewport. WebGL failures fall back to still visuals rather than removing the site.
- Real Taunton Web Co. screenshot, captured from the public homepage.
- No analytics, third-party font requests or contact form/backend.

Project text and links are in `src/data/projects.ts`. Visuals live in `src/components/`. Styling tokens are in `src/styles/tokens.css`.

## Verification

See `verification/QA.md`, JSON audit results and screenshots. Checks included the actual production bundle in Chromium at 320, 390, 768 and 1440px; animated interaction flows; keyboard dialogs; motion persistence; a browser with WebGL unavailable; and the standalone file preview.

The production build currently emits a bundle-size advisory because the application contains several animation libraries in one bundle. It builds successfully; the main JavaScript is approximately 206 KB gzipped. Further route/code splitting can be done if this grows beyond a single-page portfolio.

## Attribution and ownership

See `public/THIRD-PARTY-NOTICES.md` for complete available third-party notices and the GSAP license reference. React Bits uses MIT + Commons Clause, not unrestricted MIT; this is a composed portfolio, not a redistributed component library. Third-party code retains its original terms. The project has not been pushed to GitHub or deployed.
