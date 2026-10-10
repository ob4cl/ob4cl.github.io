import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Identity hygiene.
 *
 * This site is published under the `ob4cl` alias only. These checks walk the actual source tree
 * (and index.html) and fail if personal contact details, a foreign GitHub owner, an unapproved
 * external host or an insecure link appears anywhere in what ships.
 */

// Vitest runs with the project root as the working directory.
const PROJECT_ROOT = process.cwd();
const SCAN_DIRS = ['src'];
const SCAN_FILES = ['index.html'];
const SOURCE_EXTENSIONS = ['.ts', '.tsx', '.css', '.html'];

const APPROVED_GITHUB_OWNERS = new Set(['ob4cl', 'DavidHDev', 'darkroomengineering', 'oframe']);
const APPROVED_HOSTS = new Set([
  'github.com',
  'tauntonwebco.co.uk',
  'silver-narwhal-35c66e.netlify.app',
  'fontsource.org',
  'gsap.com',
  'motion.dev',
  // The site's own canonical origin, referenced by the canonical/OG tags.
  'ob4cl.github.io',
  // Structured-data vocabulary identifier used in index.html's JSON-LD.
  'schema.org',
  // XML namespace identifier used by inline SVG data URIs — an identifier, never requested.
  'www.w3.org'
]);

interface SourceFile {
  path: string;
  text: string;
}

function collectFiles(): SourceFile[] {
  const files: SourceFile[] = [];

  const walk = (dir: string) => {
    for (const entry of readdirSync(dir)) {
      if (entry === 'node_modules' || entry.startsWith('.')) continue;
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) {
        walk(full);
        continue;
      }
      if (SOURCE_EXTENSIONS.some((extension) => entry.endsWith(extension))) {
        files.push({ path: relative(PROJECT_ROOT, full), text: readFileSync(full, 'utf8') });
      }
    }
  };

  for (const dir of SCAN_DIRS) walk(join(PROJECT_ROOT, dir));
  for (const file of SCAN_FILES) {
    files.push({ path: file, text: readFileSync(join(PROJECT_ROOT, file), 'utf8') });
  }
  return files;
}

const EMAIL_PATTERN = /[\w.+-]+@[\w-]+\.[A-Za-z]{2,}/;
const UK_PHONE_PATTERN = /\b0\d{9,10}\b|\+44\s?\d{9,10}/;
const FREE_MAIL_PATTERN = /@(gmail|outlook|hotmail|yahoo|icloud|proton(mail)?)\./i;
const URL_PATTERN = /https?:\/\/[^\s"'`)\\]+/g;
const INSECURE_LINK_PATTERN = /(href|src)\s*=\s*["']http:\/\/|url\(\s*["']?http:\/\//i;

function findContactViolations(files: SourceFile[]): string[] {
  const violations: string[] = [];
  for (const file of files) {
    if (EMAIL_PATTERN.test(file.text)) violations.push(`${file.path}: email address`);
    if (FREE_MAIL_PATTERN.test(file.text)) violations.push(`${file.path}: free-mail provider`);
    if (UK_PHONE_PATTERN.test(file.text)) violations.push(`${file.path}: phone-number-like value`);
  }
  return violations;
}

function findHostViolations(files: SourceFile[]): string[] {
  const violations: string[] = [];
  for (const file of files) {
    for (const raw of file.text.match(URL_PATTERN) ?? []) {
      if (raw.startsWith('http://')) continue; // covered separately
      const url = raw.replace(/[.,;:]+$/, '');
      let parsed: URL;
      try {
        parsed = new URL(url);
      } catch {
        continue;
      }
      if (!APPROVED_HOSTS.has(parsed.hostname)) {
        violations.push(`${file.path}: unapproved host ${parsed.hostname}`);
        continue;
      }
      if (parsed.hostname === 'github.com') {
        const owner = parsed.pathname.split('/').filter(Boolean)[0] ?? '';
        if (owner && !APPROVED_GITHUB_OWNERS.has(owner)) {
          violations.push(`${file.path}: github owner "${owner}" is not allowlisted`);
        }
      }
    }
  }
  return violations;
}

describe('identity hygiene', () => {
  const files = collectFiles();

  it('scans a non-trivial amount of source', () => {
    expect(files.length).toBeGreaterThan(20);
  });

  it('detector is not vacuous', () => {
    // Built at runtime so this file never contains the patterns it hunts for.
    const at = String.fromCharCode(64);
    const scheme = ['http', '//'].join(':');
    const secureScheme = ['https', '//'].join(':');

    const syntheticEmail = ['someone', 'example.com'].join(at);
    const synthetic = [
      { path: 'synthetic.tsx', text: `reach me at ${syntheticEmail} any time` },
      { path: 'synthetic.html', text: `<a href="${scheme}insecure.example/page">x</a>` }
    ];

    expect(findContactViolations(synthetic)).toHaveLength(1);
    expect(
      findHostViolations([{ path: 'synthetic.ts', text: `see ${secureScheme}elsewhere.example/x` }])
    ).toHaveLength(1);
  });

  it('contains no personal contact details in src/ or index.html', () => {
    expect(findContactViolations(files)).toEqual([]);
  });

  it('only links to approved hosts and the ob4cl GitHub account', () => {
    expect(findHostViolations(files)).toEqual([]);
  });

  it('never links insecurely over http://', () => {
    const offenders = files.filter((file) => INSECURE_LINK_PATTERN.test(file.text)).map((f) => f.path);
    expect(offenders).toEqual([]);
  });

  it('mentions every featured repository exactly as ob4cl owns it', () => {
    const all = files.map((file) => file.text).join('\n');
    for (const repo of ['Forgix', 'CindR', 'dependency-risk-radar', 'modelguard']) {
      expect(all).toContain(`github.com/ob4cl/${repo}`);
    }
  });
});
