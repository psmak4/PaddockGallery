import { useCallback, useState } from 'react';

function read(key: string, initial: boolean): boolean {
  try {
    const stored = localStorage.getItem(key);
    return stored === null ? initial : stored === 'true';
  } catch {
    return initial;
  }
}

/** A boolean remembered in localStorage. Falls back to in-memory state when storage is unavailable. */
export function usePersistentToggle(key: string, initial: boolean): [boolean, (next: boolean) => void] {
  const [value, setValue] = useState(() => read(key, initial));
  const update = useCallback(
    (next: boolean) => {
      setValue(next);
      try {
        localStorage.setItem(key, String(next));
      } catch {
        // Private mode or blocked storage: keep the in-memory value for this session.
      }
    },
    [key],
  );
  return [value, update];
}
