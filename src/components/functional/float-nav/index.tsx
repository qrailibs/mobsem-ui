import {
    forwardRef,
    useCallback,
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
} from "react";
import { Props } from "helpers/types";
import { vibrate } from "hooks/useFeedback";
import { useLiquidGlass } from "components/functional/glass/use-liquid-glass";

import "./styles.css";

export interface FloatNavItem {
    value: string;
    label?: string;
    icon?: React.ReactNode;
}

export interface FloatNavProps extends Omit<Props<HTMLDivElement>, "onChange"> {
    items: FloatNavItem[];
    value?: string;
    defaultValue?: string;
    onChange?: (value: string) => void;
    variant?: "default" | "glass";
}

// Movement past this many px turns a press into a drag.
const DRAG_THRESHOLD = 4;

interface Gesture {
    startX: number;
    startLeft: number;
    pressedIndex: number;
    pointerId: number;
    /** The pill was actually dragged (vs. a plain tap). */
    dragged: boolean;
    /** Nearest item to the pill while dragging (committed on release). */
    targetIndex: number;
}

/**
 * iOS-style floating bottom navigation. Tap an item to switch, or grab the
 * selection pill and drag it onto another item — the pill follows your finger
 * and snaps to the nearest item on release.
 */
export const FloatNav = forwardRef<HTMLDivElement, FloatNavProps>(
    (
        { items, value, defaultValue, onChange, variant = "default", ...props },
        ref,
    ) => {
        const isControlled = value !== undefined;
        const [internal, setInternal] = useState(
            value ?? defaultValue ?? items[0]?.value ?? "",
        );
        const current = isControlled ? value : internal;
        const currentIndex = items.findIndex((i) => i.value === current);

        const rowRef = useRef<HTMLDivElement>(null);
        const indicatorGlassRef = useRef<HTMLDivElement>(null);
        const gesture = useRef<Gesture | null>(null);

        const isGlass = variant === "glass";

        // The whole bar is frosted liquid glass — a high post-displacement blur
        // gives it the iOS frosted look while still refracting the page behind.
        useLiquidGlass(rowRef, {
            enabled: isGlass,
            border: 0.3,
            scale: -80,
            displaceBlur: 6,
            blur: 8,
            saturation: 0.25,
            aberration: [1, -2, -6],
            frost: 0.35,
            fallbackFilter: "blur(5px) brightness(0.5)",
        });

        // The moving pill is its own liquid glass with stronger chromatic
        // aberration; it's only made visible while dragging / switching.
        useLiquidGlass(indicatorGlassRef, {
            enabled: isGlass,

            scale: -40,

            blur: 4,

            border: 0.2,

            lightness: 50,
            alpha: 0.9,

            frost: 0,

            saturation: 1,
            aberration: [1, -2, -6],

            fallbackFilter: "blur(1px) brightness(1.05)",
        });

        const [indicator, setIndicator] = useState({ left: 0, width: 0 });
        const [dragLeft, setDragLeft] = useState<number | null>(null);
        const [dragging, setDragging] = useState(false);
        // Briefly true right after the selection changes, so the pill glass
        // morphs into place then fades back out.
        const [changing, setChanging] = useState(false);

        // Snap the indicator onto the selected item (also on resize).
        const measure = useCallback(() => {
            const row = rowRef.current;
            if (!row || currentIndex < 0) return;
            const btn = row.querySelector(
                `[data-ms-floatnav-item][data-index="${currentIndex}"]`,
            ) as HTMLElement | null;
            if (btn)
                setIndicator({ left: btn.offsetLeft, width: btn.offsetWidth });
        }, [currentIndex]);

        // Layout effect so the pill is repositioned onto the (new) selected
        // item before paint — avoids a one-frame back-jump when a drag commits.
        useLayoutEffect(() => {
            measure();
        }, [measure]);

        useEffect(() => {
            const onResize = () => measure();
            window.addEventListener("resize", onResize);
            return () => window.removeEventListener("resize", onResize);
        }, [measure]);

        // When the selection changes (tap or drag commit), flash the pill glass
        // on so it morphs into the new spot, then fade it back out.
        const firstRender = useRef(true);
        useEffect(() => {
            if (firstRender.current) {
                firstRender.current = false;
                return;
            }
            setChanging(true);
            const t = window.setTimeout(() => setChanging(false), 420);
            return () => window.clearTimeout(t);
        }, [currentIndex]);

        const itemCenters = () => {
            const row = rowRef.current;
            if (!row) return [] as number[];
            return items.map((_, i) => {
                const b = row.querySelector(
                    `[data-ms-floatnav-item][data-index="${i}"]`,
                ) as HTMLElement;
                return b.offsetLeft + b.offsetWidth / 2;
            });
        };

        const commit = useCallback(
            (index: number) => {
                const item = items[index];
                if (!item) return;
                vibrate(10);
                if (!isControlled) setInternal(item.value);
                onChange?.(item.value);
            },
            [items, isControlled, onChange],
        );

        const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
            const target = (e.target as HTMLElement).closest(
                "[data-ms-floatnav-item]",
            ) as HTMLElement | null;
            if (!target) return;
            const index = Number(target.getAttribute("data-index"));
            rowRef.current?.setPointerCapture(e.pointerId);

            const g: Gesture = {
                startX: e.clientX,
                startLeft: indicator.left,
                pressedIndex: index,
                pointerId: e.pointerId,
                dragged: false,
                targetIndex: index,
            };
            gesture.current = g;
            vibrate(8);
        };

        const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
            const g = gesture.current;
            if (!g || e.pointerId !== g.pointerId) return;

            const dx = e.clientX - g.startX;

            // Dragging begins as soon as the finger moves past the threshold.
            if (!g.dragged && Math.abs(dx) <= DRAG_THRESHOLD) return;
            if (!g.dragged) {
                g.dragged = true;
                setDragging(true);
            }

            const centers = itemCenters();
            if (centers.length === 0) return;

            // The pill's travel is bounded by the first and last item centers.
            const min = centers[0] - indicator.width / 2;
            const max = centers[centers.length - 1] - indicator.width / 2;
            const left = Math.min(Math.max(g.startLeft + dx, min), max);
            setDragLeft(left);

            const center = left + indicator.width / 2;
            let nearest = 0;
            let best = Infinity;
            centers.forEach((c, i) => {
                const d = Math.abs(c - center);
                if (d < best) {
                    best = d;
                    nearest = i;
                }
            });
            // Track the snap target and give a light tick as it crosses items,
            // but DON'T change the selection until the gesture ends.
            if (nearest !== g.targetIndex) {
                g.targetIndex = nearest;
                vibrate(6);
            }
        };

        const endGesture = (
            e: React.PointerEvent<HTMLDivElement>,
            commitChange: boolean,
        ) => {
            const g = gesture.current;
            if (!g || e.pointerId !== g.pointerId) return;
            rowRef.current?.releasePointerCapture?.(e.pointerId);

            gesture.current = null;
            setDragging(false);
            setDragLeft(null);

            if (!commitChange) return;
            // Drag → the pill's nearest item; otherwise it was a tap.
            commit(g.dragged ? g.targetIndex : g.pressedIndex);
        };

        return (
            <div ref={ref} data-ms-floatnav data-variant={variant} {...props}>
                <div
                    ref={rowRef}
                    data-ms-floatnav-row
                    role="tablist"
                    onPointerDown={onPointerDown}
                    onPointerMove={onPointerMove}
                    onPointerUp={(e) => endGesture(e, true)}
                    onPointerCancel={(e) => endGesture(e, false)}
                >
                    <div
                        data-ms-floatnav-indicator
                        data-dragging={dragging || undefined}
                        style={{
                            transform: `translateX(${
                                dragLeft != null ? dragLeft : indicator.left
                            }px) scale(1.15, 1.2)`,
                            width: `${indicator.width}px`,
                        }}
                    >
                        {/* Glass layer: hidden at rest, morphs in while the
                            pill is dragging or the selection is changing. */}
                        <div
                            ref={indicatorGlassRef}
                            data-ms-floatnav-indicator-glass
                            data-active={
                                (isGlass && (dragging || changing)) || undefined
                            }
                        />
                    </div>
                    {items.map((item, index) => {
                        // Selection only follows `currentIndex`; during a drag
                        // the highlight stays put until the gesture commits.
                        const active = index === currentIndex;
                        return (
                            <button
                                key={item.value}
                                type="button"
                                data-ms-floatnav-item
                                data-index={index}
                                data-active={active || undefined}
                                role="tab"
                                aria-selected={active}
                            >
                                {item.icon && (
                                    <span data-ms-floatnav-icon>
                                        {item.icon}
                                    </span>
                                )}
                                {item.label && (
                                    <span data-ms-floatnav-label>
                                        {item.label}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>
        );
    },
);

FloatNav.displayName = "FloatNav";
