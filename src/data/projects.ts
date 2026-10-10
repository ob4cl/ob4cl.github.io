/**
 * Project dataset.
 *
 * Every factual claim below is taken from the project's own README / repository metadata,
 * read through the GitHub API before this file was written:
 *
 *   github.com/ob4cl/Forgix                (README.md, main)
 *   github.com/ob4cl/CindR                 (README.md, main)
 *   github.com/ob4cl/dependency-risk-radar (README.md, main)
 *   github.com/ob4cl/modelguard            (README.md, main)
 *   tauntonwebco.co.uk                     (live site)
 *
 * No metrics, download counts, star counts, adoption numbers or outcomes are invented or
 * asserted here. Where a project publishes a limitation, it is repeated as a limitation.
 *
 * The public identity of this site is the alias `ob4cl` only. There are no personal names,
 * no personal email addresses and no personal phone numbers in this file or anywhere in src/ —
 * enforced by src/data/identity.test.ts.
 */

export type LinkKind = 'repo' | 'live' | 'site' | 'profile';

export interface ProjectLink {
  label: string;
  href: string;
  kind: LinkKind;
}

export interface Fact {
  label: string;
  value: string;
}

export interface DetailSection {
  title: string;
  /** Optional monospace block (command, policy, identifier list). */
  code?: string;
  items: string[];
}

export type Treatment = 'terminal' | 'privacy' | 'radar' | 'weights' | 'studio';

export interface Project {
  id: string;
  num: string;
  name: string;
  kicker: string;
  tagline: string;
  lede: string;
  facts: Fact[];
  stack: string[];
  badges: string[];
  links: ProjectLink[];
  treatment: Treatment;
  treatmentCaption: string;
  details: DetailSection[];
}

export const GITHUB_PROFILE = 'https://github.com/ob4cl';
export const TAUNTON_URL = 'https://tauntonwebco.co.uk';

export const projects: Project[] = [
  {
    id: 'forgix',
    num: '01',
    name: 'Forgix',
    kicker: 'CLI tooling',
    tagline: 'Start a project once, not forty times.',
    lede: 'A scaffolding CLI with template versioning, post-scaffold hooks and governance checks. It copies a template into a new directory, injects variables, runs the package manager and writes a lock file that records where the project came from.',
    facts: [
      { label: 'Language', value: 'TypeScript' },
      { label: 'Licence', value: 'MIT' },
      { label: 'Runtime', value: 'Node.js >= 22' },
      { label: 'Install', value: 'npm install -g @fourlinx/forgix' }
    ],
    stack: ['TypeScript', 'Node.js', 'npm registry', 'YAML hooks', 'GitHub Actions'],
    badges: ['CLI', 'Templates', 'Non-interactive mode'],
    links: [
      { label: 'Repository', href: 'https://github.com/ob4cl/Forgix', kind: 'repo' }
    ],
    treatment: 'terminal',
    treatmentCaption: 'Forgix scaffolds a template tree, then audits it.',
    details: [
      {
        title: 'What it actually does',
        items: [
          'Copies a template into a new directory, injects {{projectName}} / {{author}} / {{license}} variables and skips binary files.',
          'Runs the selected package manager install, then executes the template hook chain.',
          'Writes .scaffold-lock.yaml: template name, version, source, files generated, variables, hooks that ran, patches applied.',
          'Optionally initialises git, CI, ESLint, Prettier, Jest and Docker in the same command.',
          'Runs non-interactively when every required flag is supplied, for CI and agent use.'
        ]
      },
      {
        title: 'Commands',
        code: `forgix create      # scaffold a new project
forgix check .     # governance / security audit
forgix doctor      # Node, Git, npm, VS Code checks
forgix registry    # npm-based template registries
forgix add <plugin>   # inject a feature module
forgix link <name> [path]`,
        items: [
          'Built-in templates range from react-vite and nextjs to vue-app, svelte, express-ts, fastapi and python-script.',
          'github:<owner/repo> pulls a template from any public GitHub repository.',
          'Composition layers (--layers auth database testing) stack feature sets onto a base template.'
        ]
      },
      {
        title: 'Governance check',
        items: [
          'Fourteen checks including scaffold lock presence, licence file, .gitignore, dependency lock, dangerous install scripts, exposed .env files, non-root Dockerfile user, CI configuration and hardcoded secret patterns.',
          'Scores 0-100% from pass/warn/fail and exits non-zero below 50%.',
          '--deps adds deprecated-package and npm-audit analysis.'
        ]
      },
      {
        title: 'Security model',
        items: [
          'Resolved paths validated and .. traversal blocked.',
          'Sensitive directories such as .ssh and .aws refused when linking templates.',
          'Config written to ~/.forgix-config.json with 0600 (owner-only) permissions.',
          'Remote template clones require confirmation; --trust-remote is explicit opt-in for CI.',
          'Cloned .git directories are removed; postinstall scripts raise a warning.'
        ]
      },
      {
        title: 'Stated limitations',
        items: [
          'Forgix generates structures and runs hooks — it does not maintain them afterwards.',
          'Hook commands run with your shell privileges, so templates are a trust boundary.'
        ]
      }
    ]
  },
  {
    id: 'cindr',
    num: '02',
    name: 'CindR',
    kicker: 'Product app',
    tagline: 'Your subscription data never leaves the browser.',
    lede: 'A subscription tracker with no accounts and no server. Add subscriptions, read the monthly figure, watch renewals coming — with everything stored in the browser\'s IndexedDB and exportable as JSON.',
    facts: [
      { label: 'Language', value: 'TypeScript' },
      { label: 'Licence', value: 'MIT' },
      { label: 'Storage', value: 'IndexedDB — no backend' },
      { label: 'Ship targets', value: 'Web, Android, iOS, Windows' }
    ],
    stack: [
      'React 19',
      'TypeScript',
      'Vite',
      'Tailwind CSS v4',
      'Recharts',
      'IndexedDB',
      'Capacitor',
      'Tauri',
      'Netlify'
    ],
    badges: ['PWA', 'Offline', 'No accounts', 'No tracking'],
    links: [
      { label: 'Repository', href: 'https://github.com/ob4cl/CindR', kind: 'repo' },
      {
        label: 'Live app',
        href: 'https://silver-narwhal-35c66e.netlify.app',
        kind: 'live'
      }
    ],
    treatment: 'privacy',
    treatmentCaption: 'Everything resolves locally: browser to IndexedDB, nothing outbound.',
    details: [
      {
        title: 'What it does',
        items: [
          'Dashboard: monthly spend, yearly projection, upcoming renewals and a budget gauge.',
          'Charts: spending trend over time and a category breakdown donut.',
          'Worth score: rate each subscription 1-5 and see the average.',
          'Payment logging: record when you actually paid and see the lifetime total.',
          'Price-change tracking: flags when a subscription price goes up.',
          'Export / import: JSON backup and restore on any device.',
          'Installable PWA that works offline; dark theme with a purple accent.'
        ]
      },
      {
        title: 'Deliberate non-features',
        items: [
          'No bank linking — the project does not want bank credentials.',
          'No auto-cancellation; you talk to the company yourself.',
          'No cloud sync: data lives in the browser\'s IndexedDB.',
          'No accounts, logins, emails or tracking.'
        ]
      },
      {
        title: 'Build targets',
        code: `npm run dev            # local development
npm run build:spa      # web build (Netlify)
npm run deploy:android # Capacitor -> Android Studio
npm run deploy:desktop # Tauri -> Windows executable`,
        items: [
          'One React codebase, four targets: browser, Android, iOS and a Tauri desktop build.'
        ]
      },
      {
        title: 'Stated limitations',
        items: [
          'CindR will not cancel subscriptions or negotiate bills, and has no bank integration.',
          'It is a clean, fast, private dashboard showing where the money goes — that is the whole claim.'
        ]
      }
    ]
  },
  {
    id: 'dependency-risk-radar',
    num: '03',
    name: 'dependency-risk-radar',
    kicker: 'CI / supply chain',
    tagline: 'One pre-merge question, answered deterministically.',
    lede: 'A dependency-change gate for platform teams: does this dependency delta violate our risk policy? It diffs direct dependencies between two refs, scores transitive impact against explicit policy, and returns a decision a pipeline can act on.',
    facts: [
      { label: 'Language', value: 'TypeScript' },
      { label: 'Licence', value: 'MIT' },
      { label: 'Ecosystems (v1)', value: 'npm, pnpm' },
      { label: 'Surfaces', value: 'CLI, GitHub Action, MCP server' }
    ],
    stack: [
      'TypeScript',
      'pnpm monorepo',
      'GitHub Actions',
      'MCP',
      'CycloneDX',
      'OSV / npm registry metadata',
      'policy files'
    ],
    badges: ['Deterministic', 'Policy-first', 'Exit-code contract'],
    links: [
      {
        label: 'Repository',
        href: 'https://github.com/ob4cl/dependency-risk-radar',
        kind: 'repo'
      }
    ],
    treatment: 'radar',
    treatmentCaption: 'Sweep, ring and spoke: the scanner reads the dependency field.',
    details: [
      {
        title: 'Decision model',
        code: `pass       safe to proceed under policy
warn       merge allowed, reviewer attention required
high-risk  elevated risk, explicit approval / escalation
fail       merge blocked by policy or critical threshold`,
        items: [
          'Same refs plus same policy equals the same decision — the analysis core is deterministic.',
          'Optional provider enrichment (registry metadata, OSV vulnerabilities) runs after the core diff, never instead of it.'
        ]
      },
      {
        title: 'Outputs a pipeline can use',
        items: [
          'Structured JSON for automation, Markdown for code-review context, and a recommended exit code.',
          'CycloneDX SBOM export through the reporter API (renderSbomReport) or the CLI (--output sbom).',
          'GitHub Action outputs: json, markdown, decision, score, exit-code-recommendation.'
        ]
      },
      {
        title: 'Policy file',
        code: `thresholds:
  block_score: 70
  warn_score: 25
scoring:
  weights:
    vulnerability: 40
    install_time_execution: 20
    blast_radius: 15
    maintenance_trust: 15
    policy: 10
policies:
  block_known_critical_vulns: true
  require_lockfile: true`,
        items: [
          'Risk findings combine known vulnerabilities, install-time execution hooks, transitive blast-radius deltas, maintenance-trust signals and explicit package/licence denials.',
          'Thresholds and weights are policy-controlled, so a stricter production policy or a temporary migration window is a reviewable file change.'
        ]
      },
      {
        title: 'Trust boundaries',
        items: [
          'repoPath must resolve inside an allowed workspace root, with realpath checks against traversal and symlink escape.',
          'An explicit policyPath is fail-closed and restricted to the repository root or an allowed config directory; a missing or invalid policy fails the run instead of silently passing.',
          'CI installs with --frozen-lockfile --ignore-scripts in untrusted pull_request mode.'
        ]
      },
      {
        title: 'Stated limitations',
        items: [
          'JavaScript and TypeScript workflows only in v1 — no Python, Rust or Java ecosystems yet.',
          'Transitive analysis is impact scoring (reachable-package deltas), not a full workspace-wide graph diff.',
          'Analysis scope is repository-root package.json plus lockfile, not multi-workspace discovery.',
          'No automated remediation or fix-PR generation.',
          'Pre-1.0: release hardening is complete, but the public API can still move.'
        ]
      }
    ]
  },
  {
    id: 'modelguard',
    num: '04',
    name: 'modelguard',
    kicker: 'ML security',
    tagline: 'Ghosts in the weights.',
    lede: 'An ML supply-chain scanner: backdoored weights, poisoned layers and adversarial triggers, found before a model is loaded rather than after. Trivy for neural networks — weight-level inspection and behavioural testing in the same tool.',
    facts: [
      { label: 'Language', value: 'Python 3.10+' },
      { label: 'Licence', value: 'MIT' },
      { label: 'Status', value: 'Alpha' },
      { label: 'Install', value: 'pip install modelguard' }
    ],
    stack: ['Python', 'safetensors', 'GGUF', 'PyTorch', 'CycloneDX 1.5', 'HuggingFace Hub'],
    badges: ['Weight scan', 'Activation scan', 'Behavioural probes', 'SBOM'],
    links: [
      { label: 'Repository', href: 'https://github.com/ob4cl/modelguard', kind: 'repo' }
    ],
    treatment: 'weights',
    treatmentCaption: 'Rules, severities and a CVE-style registry of known backdoors.',
    details: [
      {
        title: 'Rule families',
        code: `MG-WEIGHT-001  INFO      unsupported / corrupted format
MG-WEIGHT-002  CRITICAL  NaN / Inf values in tensors
MG-WEIGHT-003  HIGH      extreme weight magnitudes
MG-WEIGHT-004  MEDIUM    statistical outliers (z-score)
MG-WEIGHT-006  HIGH      anomalous embedding vectors
MG-ACT-001..5  MEDIUM    dead / saturated neurons, frozen layers
MG-BEH-001..2  varies    known trigger phrases, refusal failures`,
        items: [
          'Weight anomaly scanning runs without torch; activation and behavioural scanning require it.',
          'Behavioural probes test seven known trigger categories drawn from Sleeper Agents and dataset-poisoning research.'
        ]
      },
      {
        title: 'Known backdoor registry',
        code: `MG-2024-0001  BadNets — pixel-level trigger            HIGH
MG-2024-0002  TrojanNN — weight-based injection         HIGH
MG-2024-0003  Sleeper Agent — persistent LLM backdoor   CRITICAL
MG-2024-0004  Dataset poisoning — vulnerable code gen   CRITICAL
MG-2024-0005  Malicious pickle payload (RCE)            CRITICAL
MG-2024-0009  Embedding layer poisoning                 CRITICAL
MG-2024-0010  LoRA adapter backdoor                     HIGH`,
        items: [
          'Signature matching covers exact SHA-256 hashes, partial hashes and structural fingerprints.',
          'Format handlers inspect safetensors (safe by design), GGUF and PyTorch (pickle RCE risk detection) without executing the model.'
        ]
      },
      {
        title: 'In a pipeline',
        code: `modelguard scan --format json --fail-on high ./models/ > scan-results.json
modelguard scan --hub meta-llama/Llama-2-7b-hf
modelguard sbom path/to/model/
modelguard hub audit --top 10`,
        items: [
          'Findings can gate a deployment (--fail-on high) or be consumed from Python via scan_model().',
          'CycloneDX 1.5 SBOMs describe what a model artefact actually contains.'
        ]
      },
      {
        title: 'Research it builds on',
        items: [
          'BadNets (Gu et al., 2017) — the first systematic study of neural-network backdoors.',
          'Neural Cleanse (Wang et al., 2019) — backdoor detection by trigger reconstruction.',
          'Trojaning Attack on Neural Networks (Liu et al., 2018) — weight modification attacks.',
          'Sleeper Agents (Hubinger et al., 2024) — persistent backdoors through safety training.',
          'Poisoning Web-Scale Datasets (Carlini et al., 2024) — practical dataset poisoning at scale.'
        ]
      },
      {
        title: 'Stated limitations',
        items: [
          'Alpha software: the signature registry is curated, so absence of a finding is not proof of safety.',
          'Activation and behavioural scanning need torch and a loadable model.',
          'Roadmap still open: online signature updates, a VS Code extension, HuggingFace model-card integration, community signature contributions and a CI GitHub Action.'
        ]
      }
    ]
  },
  {
    id: 'taunton-web-co',
    num: '05',
    name: 'Taunton Web Co.',
    kicker: 'Independent studio',
    tagline: 'Built locally. Made to stand out.',
    lede: 'Independent web design in Taunton, Somerset, for small businesses — trades, salons, garages, clinics and shops that need to be found and to look the part. Every plan starts with a free homepage mock-up: you only pay once you are happy with it.',
    facts: [
      { label: 'Based', value: 'Taunton, Somerset' },
      { label: 'Plans', value: 'Kickstart · Kickstart + Care · Custom' },
      { label: 'Starting point', value: 'Free homepage mock-up' },
      { label: 'Care plan', value: 'Hosting, backups, security, small edits' }
    ],
    stack: ['Mobile-first design', 'Local SEO foundations', 'Accessible markup', 'Static hosting'],
    badges: ['Web design', 'Small business', 'Somerset'],
    links: [{ label: 'tauntonwebco.co.uk', href: TAUNTON_URL, kind: 'site' }],
    treatment: 'studio',
    treatmentCaption: 'Example builds are published as clickable demos, not mockups.',
    details: [
      {
        title: 'How a build runs',
        code: `01  a free homepage mock-up, yours to keep
02  you decide — no contract to get started
03  full build, domain connected, live in about 3 days
04  optional £25/month care: hosting, backups, small edits`,
        items: [
          'Plans published on the site: Kickstart (up to five pages, mobile-first, Google-ready from launch, click-to-call, one round of edits), Kickstart + Care, and Custom for shops, bookings or larger builds.',
          'Care keeps the site hosted, backed up, secure and updated, with small text and photo edits included.'
        ]
      },
      {
        title: 'Design position',
        items: [
          'A considered visual identity, clear writing and a layout that makes a local business easy to understand.',
          'Designed for phones first, with services and contact details where people actually look for them.',
          'Lean pages and local SEO foundations — explicitly no ranking promises, just a proper starting point.'
        ]
      },
      {
        title: 'Example builds',
        items: [
          'Salon and beauty, trades and services, and automotive concept builds are published as full clickable demos.',
          'Each is labelled as an illustrative business rather than a client commission — the honest version of a portfolio.'
        ]
      },
      {
        title: 'Sourcing note',
        items: [
          'Everything on this page about Taunton Web Co. is taken from the studio\'s own published site; current pricing lives there rather than being frozen into this gallery.'
        ]
      }
    ]
  }
];

/** The four GitHub repositories featured here, in gallery order. */
export const GITHUB_PROJECT_IDS = [
  'forgix',
  'cindr',
  'dependency-risk-radar',
  'modelguard'
] as const;

/** Real stack terms used by the scrolling band — all of them appear in project data above. */
export const MARQUEE_TERMS: string[] = [
  'TypeScript',
  'React 19',
  'Python',
  'IndexedDB',
  'pnpm monorepo',
  'GitHub Actions',
  'safetensors',
  'CycloneDX',
  'MCP',
  'Tauri',
  'Capacitor',
  'Tailwind CSS v4',
  'Node.js',
  'policy files'
];
