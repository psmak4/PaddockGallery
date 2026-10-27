/** Keys typed into a text field belong to the field, not to page shortcuts. */
export function isTypingTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el || !el.tagName) return false;
  return el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable;
}

/** Space and Enter already press a focused button or link; shortcuts shouldn't press it a second time. */
export function isInteractiveTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  return Boolean(el?.closest?.('button, a[href], [role="button"]')) || isTypingTarget(target);
}

/** Ctrl/Cmd/Alt combinations belong to the browser and OS. Shift counts too unless allowed (e.g. "?"). */
export function hasModifier(e: KeyboardEvent, { allowShift = false } = {}): boolean {
  return e.altKey || e.ctrlKey || e.metaKey || (!allowShift && e.shiftKey);
}

/** True when a page shortcut should ignore this key press. */
export function shouldIgnoreShortcut(e: KeyboardEvent): boolean {
  return e.defaultPrevented || hasModifier(e) || isTypingTarget(e.target);
}
