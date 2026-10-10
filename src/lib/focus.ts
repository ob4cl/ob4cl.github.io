/**
 * Focus utilities for the details dialog.
 *
 * Kept framework-free so they can be unit-tested directly against jsdom.
 */

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'summary',
  '[tabindex]:not([tabindex="-1"])'
].join(',');

export function getFocusable(root: HTMLElement): HTMLElement[] {
  const nodes = Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));

  return nodes.filter((node) => {
    if (node.hasAttribute('inert')) return false;
    if (node.hasAttribute('disabled')) return false;
    if (node.getAttribute('aria-hidden') === 'true') return false;
    if (node.getAttribute('tabindex') === '-1') return false;
    if (node.closest('[aria-hidden="true"]')) return false;
    return isRendered(node);
  });
}

/**
 * Browsers and jsdom disagree about this: jsdom implements no layout engine, so `getClientRects()`
 * and `offsetParent` are always empty there and elements must not be filtered on them. Detect
 * layout support once and only apply the geometric test when there is geometry to inspect.
 */
const hasLayoutEngine = (): boolean => {
  if (typeof document === 'undefined') return false;
  return document.documentElement.getClientRects().length > 0;
};

function isRendered(node: HTMLElement): boolean {
  if (!hasLayoutEngine()) return true;
  if (node.getClientRects().length > 0) return true;
  return node.offsetParent !== null;
}

export function getFirstAndLastFocusable(root: HTMLElement): [HTMLElement | null, HTMLElement | null] {
  const focusable = getFocusable(root);
  if (focusable.length === 0) return [null, null];
  return [focusable[0], focusable[focusable.length - 1]];
}

/**
 * Move focus within `root` when Tab would otherwise leave it. Returns true when focus was
 * redirected, so callers can preventDefault.
 */
export function trapTabKey(
  root: HTMLElement,
  active: Element | null,
  shiftKey: boolean
): boolean {
  const [first, last] = getFirstAndLastFocusable(root);
  if (!first || !last) return false;

  const inside = active instanceof Node && root.contains(active);

  if (shiftKey) {
    if (!inside || active === first) {
      last.focus();
      return true;
    }
    return false;
  }

  if (!inside || active === last) {
    first.focus();
    return true;
  }
  return false;
}
