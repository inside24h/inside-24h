// Accessibility helpers shared by every dialog, sheet and drawer (WCAG 2.2: 2.1.2 no keyboard trap except a
// modal one that Esc leaves, 2.4.3 focus order, 2.4.11 focus not obscured).
import { useEffect, useRef, type RefObject } from 'react';

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), summary, [tabindex]:not([tabindex="-1"])';

/** Everything inside `root` that can take keyboard focus, in DOM order (hidden elements skipped). */
export function focusables(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => !el.closest('[hidden]') && el.getClientRects().length > 0);
}

/**
 * While `active`: moves focus into `ref` (the element marked [data-autofocus], else the first focusable one, else the
 * container itself), keeps Tab and Shift+Tab inside it, and closes it on Escape. When it closes, focus goes back to
 * whatever had it before (the button that opened it), so keyboard users never get lost.
 */
const stack: object[] = []; // open modals, newest last: only the top one handles keys

export function useModal(ref: RefObject<HTMLElement | null>, active: boolean, onClose: () => void) {
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    if (!active) return;
    const before = document.activeElement as HTMLElement | null;
    const me = {};
    stack.push(me);
    const root = ref.current;
    if (root && !root.contains(document.activeElement)) {
      const first = root.querySelector<HTMLElement>('[data-autofocus]') ?? focusables(root)[0];
      (first ?? root).focus({ preventScroll: true });
    }
    const onKey = (e: KeyboardEvent) => {
      const el = ref.current;
      if (!el || stack[stack.length - 1] !== me) return;
      if (e.key === 'Escape') {
        // an open listbox inside the dialog (search, city) closes first
        const t = e.target as HTMLElement | null;
        if (t?.getAttribute('aria-expanded') === 'true' && t.getAttribute('role') === 'combobox') return;
        e.stopPropagation(); close.current(); return;
      }
      if (e.key !== 'Tab') return;
      const list = focusables(el);
      if (!list.length) { e.preventDefault(); el.focus(); return; }
      const first = list[0], last = list[list.length - 1];
      const cur = document.activeElement as HTMLElement | null;
      if (e.shiftKey && (cur === first || !el.contains(cur))) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && (cur === last || !el.contains(cur))) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('keydown', onKey, true);
      stack.splice(stack.indexOf(me), 1);
      // give focus back only if it was left inside the closed dialog (or on the page body)
      const now = document.activeElement;
      if (before && document.contains(before) && (!now || now === document.body || !document.contains(now) || root?.contains(now))) before.focus({ preventScroll: true });
    };
  }, [active, ref]);
}

/** Lets reduced-motion users keep the page still (playback, camera flights, tweened numbers). */
export function prefersReducedMotion(): boolean {
  try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; }
}
