"use client";

import { useCallback, useRef } from "react";

type Options = {
  onPrev: () => void;
  onNext: () => void;
  /** 触发切题的最小水平位移，默认 56 */
  threshold?: number;
  /** 水平主导垂直的倍数，避免误触滚动，默认 1.2 */
  axisRatio?: number;
  disabled?: boolean;
};

/**
 * 移动端左右滑动切题。
 * 左滑 → 下一题；右滑 → 上一题。
 */
export function useSwipeNav({
  onPrev,
  onNext,
  threshold = 56,
  axisRatio = 1.2,
  disabled = false,
}: Options) {
  const start = useRef<{ x: number; y: number } | null>(null);

  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (disabled) return;
      const t = e.touches[0];
      if (!t) return;
      start.current = { x: t.clientX, y: t.clientY };
    },
    [disabled],
  );

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (disabled || !start.current) return;
      const t = e.changedTouches[0];
      if (!t) {
        start.current = null;
        return;
      }
      const dx = t.clientX - start.current.x;
      const dy = t.clientY - start.current.y;
      start.current = null;

      if (Math.abs(dx) < threshold) return;
      if (Math.abs(dx) < Math.abs(dy) * axisRatio) return;

      if (dx < 0) onNext();
      else onPrev();
    },
    [disabled, threshold, axisRatio, onNext, onPrev],
  );

  const onTouchCancel = useCallback(() => {
    start.current = null;
  }, []);

  return {
    onTouchStart,
    onTouchEnd,
    onTouchCancel,
  };
}
