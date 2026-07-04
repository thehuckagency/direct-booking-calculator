import { useEffect, useRef, useState } from "react";

/** True when the user has asked the OS to reduce motion. */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const on = () => setReduced(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return reduced;
}

/** Debounce a rapidly-changing value (used so the display eases, not jitters). */
export function useDebouncedValue<T>(value: T, delay = 120): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

/**
 * Ease a displayed number toward `target` with an ease-out curve.
 * Honours reduced-motion by snapping instantly. Runs on rAF, cancels cleanly.
 *
 * The currently-displayed value is tracked in a ref (not read from the render
 * closure) so frequent parent re-renders never restart the animation from a
 * stale value, and a `to` guard skips re-triggering when the target is steady.
 */
export function useCountUp(target: number, durationMs = 650): number {
  const reduced = useReducedMotion();
  const [display, setDisplay] = useState(target);
  const displayRef = useRef(target);
  const toRef = useRef(target);
  const fromRef = useRef(target);
  const startRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (reduced) {
      displayRef.current = target;
      toRef.current = target;
      setDisplay(target);
      return;
    }
    // Already at / animating toward this target — don't restart.
    if (target === toRef.current) return;

    fromRef.current = displayRef.current;
    toRef.current = target;
    startRef.current = 0;

    const easeOutQuint = (t: number) => 1 - Math.pow(1 - t, 5);

    const tick = (now: number) => {
      if (startRef.current === 0) startRef.current = now;
      const t = Math.min(1, (now - startRef.current) / durationMs);
      const value = fromRef.current + (toRef.current - fromRef.current) * easeOutQuint(t);
      displayRef.current = value;
      setDisplay(value);
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    // Fallback: requestAnimationFrame is paused in hidden/background tabs and
    // headless renderers, which would freeze the figure at a stale value. This
    // timer guarantees we always land on the correct target regardless.
    const fallback = window.setTimeout(() => {
      displayRef.current = target;
      setDisplay(target);
    }, durationMs + 150);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.clearTimeout(fallback);
    };
  }, [target, reduced, durationMs]);

  return reduced ? target : display;
}
