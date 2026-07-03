import { useEffect, useState } from 'react';

/**
 * Reactive `window.matchMedia`. Returns false in environments without
 * matchMedia (tests) and keeps up with viewport changes (rotation, resize
 * across the breakpoint).
 */
const useMediaQuery = (query: string): boolean => {
  const supported = typeof window !== 'undefined' && typeof window.matchMedia === 'function';
  const [matches, setMatches] = useState<boolean>(
    supported ? window.matchMedia(query).matches : false,
  );

  useEffect(() => {
    if (!supported) return;
    const mql = window.matchMedia(query);
    const onChange = (e: MediaQueryListEvent) => setMatches(e.matches);
    setMatches(mql.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [query, supported]);

  return matches;
};

export default useMediaQuery;
