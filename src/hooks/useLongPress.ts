import { useRef } from "react";

const MOVE_THRESHOLD = 10; // pixels - if user moves more than this, cancel long press

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
    const startPosRef = useRef<{ x: number; y: number } | null>(null);
    const cancelledRef = useRef(false);
    const endCalledRef = useRef(false);

    const start = (e: React.TouchEvent | React.MouseEvent) => {
        // Only prevent default on touch events immediately
        // For mouse events, we'll prevent default only if long press activates
        if ("touches" in e) {
            e.preventDefault();
        }

        isLongPressRef.current = false;
        cancelledRef.current = false;
        endCalledRef.current = false;

        const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
        const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

        startPosRef.current = { x: clientX, y: clientY };

        if (onStart) onStart();

        timeoutRef.current = window.setTimeout(() => {
            if (!cancelledRef.current) {
                isLongPressRef.current = true;
                onLongPress();
            }
        }, delay);
    };

    const move = (e: React.TouchEvent | React.MouseEvent) => {
        const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
        const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

        // If long press hasn't triggered yet, check if user moved too much (scrolling)
        if (
            !isLongPressRef.current &&
            startPosRef.current &&
            !cancelledRef.current
        ) {
            const deltaX = Math.abs(clientX - startPosRef.current.x);
            const deltaY = Math.abs(clientY - startPosRef.current.y);

            if (deltaX > MOVE_THRESHOLD || deltaY > MOVE_THRESHOLD) {
                // User is scrolling, cancel the long press
                cancelledRef.current = true;
                if (timeoutRef.current) {
                    clearTimeout(timeoutRef.current);
                    timeoutRef.current = null;
                }
                // Immediately reset pressing state
                if (onEnd && !endCalledRef.current) {
                    endCalledRef.current = true;
                    onEnd();
                }
                return;
            }
        }

        // If long press is already active, prevent default and allow moving the item
        if (isLongPressRef.current) {
            e.preventDefault();
            onMove(clientX, clientY);
        }
    };

    const clear = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
        isLongPressRef.current = false;
        cancelledRef.current = false;
        startPosRef.current = null;

        // Only call onEnd if it hasn't been called yet (e.g., during scroll cancellation)
        if (onEnd && !endCalledRef.current) {
            onEnd();
        }
        endCalledRef.current = false;
    };

    return {
        onMouseDown: start,
        onMouseMove: move,
        onMouseUp: clear,
        // Don't clear on mouse leave - the portal rendering can trigger false mouseleave events
        // onMouseLeave: clear,
        onTouchStart: start,
        onTouchMove: move,
        onTouchEnd: clear,
    };
}
