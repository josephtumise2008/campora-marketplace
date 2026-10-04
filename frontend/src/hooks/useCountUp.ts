import { useEffect, useRef } from "react";
import { animate, useReducedMotion } from "framer-motion";

/**
 * Counts a number up from zero whenever `value` changes, writing straight to
 * the node's text content so a 30-tile dashboard does not re-render 60x a
 * second. Honours `prefers-reduced-motion` by snapping to the final value.
 */
export function useCountUp(
  value: number,
  format: (n: number) => string,
  duration = 0.9
) {
  const ref = useRef<HTMLSpanElement>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;

    if (reducedMotion || !Number.isFinite(value)) {
      node.textContent = format(value);
      return undefined;
    }

    const controls = animate(0, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (current) => {
        node.textContent = format(current);
      },
    });

    return () => controls.stop();
    // `format` is intentionally excluded: callers pass inline arrow functions,
    // and re-running the tween on every render would restart the animation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration, reducedMotion]);

  return ref;
}