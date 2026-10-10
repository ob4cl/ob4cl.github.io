import { useEffect, useState, type RefObject } from 'react';

/** Expensive canvas effects only run around the visible viewport. */
export function useNearViewport(ref: RefObject<HTMLElement | null>) {
  const [near, setNear] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (!('IntersectionObserver' in window)) { setNear(true); return; }
    const observer = new IntersectionObserver(([entry]) => setNear(entry.isIntersecting), { rootMargin: '160px' });
    observer.observe(node);
    return () => observer.disconnect();
  }, [ref]);
  return near;
}
