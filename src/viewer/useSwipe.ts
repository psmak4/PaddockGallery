import { useEffect, type RefObject } from 'react';

const MIN_DISTANCE = 50;

export function useSwipe(ref: RefObject<HTMLElement | null>, handlers: { onLeft: () => void; onRight: () => void }) {
  const { onLeft, onRight } = handlers;
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let start: { x: number; y: number } | null = null;
    const down = (e: PointerEvent) => {
      if (e.pointerType === 'mouse') return;
      start = { x: e.clientX, y: e.clientY };
    };
    const up = (e: PointerEvent) => {
      if (!start) return;
      const dx = e.clientX - start.x;
      const dy = e.clientY - start.y;
      start = null;
      if (Math.abs(dx) < MIN_DISTANCE || Math.abs(dx) <= Math.abs(dy)) return;
      if (dx < 0) onLeft();
      else onRight();
    };
    const cancel = () => {
      start = null;
    };
    el.addEventListener('pointerdown', down);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', cancel);
    return () => {
      el.removeEventListener('pointerdown', down);
      el.removeEventListener('pointerup', up);
      el.removeEventListener('pointercancel', cancel);
    };
  }, [ref, onLeft, onRight]);
}
