/**
 * Global accessibility helper for decorative SVG icons (Lucide & similar).
 *
 * Strategy: every Lucide icon renders as `<svg class="lucide ...">`. By default
 * screen readers may announce these as "image" or read raw <title>/<desc>
 * elements, producing duplicated noise next to the visible text label.
 *
 * This helper marks ALL Lucide SVGs as decorative (`aria-hidden="true"`,
 * `focusable="false"`, `role="presentation"`) UNLESS the author explicitly
 * opted into an accessible label by setting one of:
 *   - aria-label="..."
 *   - aria-labelledby="..."
 *   - role="img"
 *   - data-a11y="visible"   (escape hatch on the SVG or any ancestor)
 *
 * Runs once on mount and watches for newly inserted icons via MutationObserver.
 */

const SHOULD_EXPOSE_SELECTOR = [
  '[aria-label]',
  '[aria-labelledby]',
  '[role="img"]',
  '[data-a11y="visible"]',
].join(',');

function markIcon(svg: SVGElement) {
  // Already processed
  if (svg.dataset.a11yProcessed === '1') return;

  // Author opted-in to an accessible label on the icon itself.
  if (svg.matches(SHOULD_EXPOSE_SELECTOR)) {
    svg.dataset.a11yProcessed = '1';
    return;
  }

  // Author opted-in via an ancestor (e.g. a button with aria-label wrapping
  // the icon). In that case the icon must stay hidden so the parent's label
  // is the only thing announced.
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  if (!svg.hasAttribute('role')) svg.setAttribute('role', 'presentation');
  svg.dataset.a11yProcessed = '1';
}

function scan(root: ParentNode) {
  const icons = root.querySelectorAll<SVGElement>('svg.lucide');
  icons.forEach(markIcon);
}

let started = false;

export function startIconA11y() {
  if (started || typeof document === 'undefined') return;
  started = true;

  const run = () => {
    scan(document);

    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        m.addedNodes.forEach((node) => {
          if (node.nodeType !== 1) return;
          const el = node as Element;
          if (el.tagName === 'svg' && el.classList.contains('lucide')) {
            markIcon(el as unknown as SVGElement);
          } else {
            scan(el);
          }
        });
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run, { once: true });
  } else {
    run();
  }
}
