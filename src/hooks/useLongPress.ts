import { useRef } from "react";

export function useLongPress({
  delay = 500,
  onLongPress,
  onMove,
  onStart,
  onEnd,
}: {
  delay: number;
  onLongPress: () => void;
  onMove: (x: number, y: number) => void;
  onStart?: () => void;
  onEnd?: () => void;
}) {
  const timeoutRef = useRef<number | null>(null);
  const isLongPressRef = useRef(false);

  const start = (e: React.TouchEvent | React.MouseEvent) => {
    isLongPressRef.current = false;
    if (onStart) onStart();

    timeoutRef.current = window.setTimeout(() => {
      isLongPressRef.current = true;
      onLongPress();
    }, delay);
  };

  const move = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isLongPressRef.current) return;

    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

    onMove(clientX, clientY);
  };

  const clear = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    isLongPressRef.current = false;
    if (onEnd) onEnd();
  };

  return {
    onMouseDown: start,
    onMouseMove: move,
    onMouseUp: clear,
    onMouseLeave: clear,
    onTouchStart: start,
    onTouchMove: move,
    onTouchEnd: clear,
  };
}
