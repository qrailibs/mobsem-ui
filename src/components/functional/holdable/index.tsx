import { useState, useRef, useEffect, ReactElement } from "react";

import { useLongPress } from "hooks/useLongPress";
import { PropsWithChildren, PropsWithRef } from "helpers/types";
import { Popover } from "components/semantical";

import "./styles.css";

type HoldMenuItemVariant = "default" | "destructive" | "secondary";

export interface HoldMenuItem {
    icon?: ReactElement;
    label: string;
    variant?: HoldMenuItemVariant;
    onSelect: () => void;
}

interface HoldableProps extends PropsWithChildren<HTMLElement> {
    render: (props: PropsWithRef<HTMLLIElement>) => ReactElement;
    menu?: HoldMenuItem[];
}

const HOLD_MOVE_OFFSET_PCT = 0.06; // 6%
const CLOSE_ANIMATION_MS = 250;
const LONG_PRESS_DELAY = 600;

export function Holdable({
    children,
    render,
    menu,
    ...restProps
}: HoldableProps) {
    // --- State ---
    const [opened, setOpened] = useState(false);
    const [closing, setClosing] = useState(false);
    const [pressing, setPressing] = useState(false);
    const [pressingClosing, setPressingClosing] = useState(false);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [position, setPosition] = useState({
        x: 0,
        y: 0,
        width: 0,
        height: 0,
    });

    // --- Refs ---
    const itemRef = useRef<HTMLLIElement>(null);
    const centerRef = useRef({ x: 0, y: 0 });
    const pressingTimerRef = useRef<number | null>(null);
    const offsetAnimRef = useRef<number | null>(null);

    // --- Handlers ---
    const handleMove = (clientX: number, clientY: number) => {
        if (!(pressing || opened)) return;
        const dx = (clientX - centerRef.current.x) * HOLD_MOVE_OFFSET_PCT;
        const dy = (clientY - centerRef.current.y) * HOLD_MOVE_OFFSET_PCT;
        setOffset({ x: dx, y: dy });
    };

    const animateOffsetToZero = (durationMs = 220) => {
        if (offsetAnimRef.current) {
            cancelAnimationFrame(offsetAnimRef.current);
            offsetAnimRef.current = null;
        }
        const start = { x: offset.x, y: offset.y };
        const startTime = performance.now();
        const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
        const step = () => {
            const now = performance.now();
            const t = Math.min(1, (now - startTime) / durationMs);
            const e = easeOutCubic(t);
            setOffset({ x: start.x * (1 - e), y: start.y * (1 - e) });
            if (t < 1) {
                offsetAnimRef.current = requestAnimationFrame(step);
            } else {
                offsetAnimRef.current = null;
            }
        };
        offsetAnimRef.current = requestAnimationFrame(step);
    };

    const captureCurrentPosition = () => {
        const rect = itemRef.current?.getBoundingClientRect();
        if (!rect) return false;

        centerRef.current = {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2,
        };

        setPosition({
            x: rect.left,
            y: rect.top,
            width: rect.width,
            height: rect.height,
        });

        return true;
    };

    const handleOpen = () => {
        const ok = captureCurrentPosition();
        if (!ok) return;

        setOpened(true);
        setPressing(false);
    };

    const handleClose = () => {
        setClosing(true);
        setOffset({ x: 0, y: 0 });
        setTimeout(() => {
            setOpened(false);
            setClosing(false);
        }, CLOSE_ANIMATION_MS);
    };

    const handleSelect = (action: () => void) => {
        action?.();
        handleClose();
    };

    // --- Long press ---
    const longPressBindings = useLongPress({
        delay: LONG_PRESS_DELAY,
        onLongPress: handleOpen,
        onMove: handleMove,
        onStart: () => {
            // Delay showing the pressing state a bit for a more iOS-like feel
            if (pressingTimerRef.current) {
                window.clearTimeout(pressingTimerRef.current);
                pressingTimerRef.current = null;
            }
            setOffset({ x: 0, y: 0 });
            captureCurrentPosition();
            pressingTimerRef.current = window.setTimeout(() => {
                setPressing(true);
                pressingTimerRef.current = null;
            }, 80);
        },
        onEnd: () => {
            if (pressingTimerRef.current) {
                window.clearTimeout(pressingTimerRef.current);
                pressingTimerRef.current = null;
            }
            if (opened) {
                // Opened flow closes via global end → handleClose
                setPressing(false);
                animateOffsetToZero();
                return;
            }
            // Cancelled before opening: play a quick fade/scale-out
            setPressing(false);
            setPressingClosing(true);
            setOffset({ x: 0, y: 0 });
            setTimeout(() => setPressingClosing(false), CLOSE_ANIMATION_MS);
        },
    });

    // --- Global listeners ---
    useEffect(() => {
        if (!opened) return;

        const onEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape") handleClose();
        };

        const onGlobalMove = (e: MouseEvent | TouchEvent) => {
            const point = "touches" in e ? e.touches[0] : e;
            handleMove(point.clientX, point.clientY);
        };

        document.addEventListener("keydown", onEscape);
        document.addEventListener("mousemove", onGlobalMove);
        document.addEventListener("touchmove", onGlobalMove);
        document.body.style.overflow = "hidden";

        return () => {
            document.removeEventListener("keydown", onEscape);
            document.removeEventListener("mousemove", onGlobalMove);
            document.removeEventListener("touchmove", onGlobalMove);
            document.body.style.overflow = "";
        };
    }, [opened]);

    // Cleanup any ongoing offset animation on unmount
    useEffect(() => {
        return () => {
            if (offsetAnimRef.current)
                cancelAnimationFrame(offsetAnimRef.current);
        };
    }, []);

    // --- Render ---
    return (
        <>
            {opened && (
                <Popover
                    visible={opened}
                    data-closing={closing}
                    data-ms-holdoverlay
                    onClick={handleClose}
                />
            )}

            {render({
                ref: itemRef,
                role: "listitem",
                "data-ms-holdable": true,
                "data-state": "idle",
                ...longPressBindings,
                ...restProps,
            })}

            {/* Floating copy rendered on top while opened */}
            {(pressing || opened || pressingClosing) &&
                render({
                    role: "listitem",
                    "aria-hidden": true,
                    "data-ms-holdable": true,
                    "data-state": pressing ? "pressing" : "active",
                    style: positioned({
                        x: position.x,
                        y: position.y,
                        offsetX: offset.x,
                        offsetY: offset.y,
                        width: position.width,
                        height: position.height,
                        scale: pressing
                            ? 1
                            : opened
                            ? closing
                                ? 0.98
                                : 1.03
                            : 0.98,
                        opacity: pressing || (opened && !closing) ? 1 : 0,
                    }),
                })}

            {/* Context menu */}
            {opened && menu && menu.length > 0 && (
                <div
                    role="menu"
                    data-ms-holdmenu
                    data-open={opened && !closing}
                    data-animation={closing ? "closing" : undefined}
                    style={menuPosition({
                        x: position.x,
                        y: position.y,
                        width: position.width,
                        height: position.height,
                        offsetX: offset.x,
                        offsetY: offset.y,
                    })}
                    onClick={(e) => e.stopPropagation()}
                >
                    {menu.map((item, index) => (
                        <button
                            key={`${item.label}-${index}`}
                            type="button"
                            role="menuitem"
                            data-ms-holdmenu-item
                            data-variant={item.variant ?? "default"}
                            onClick={() => handleSelect(item.onSelect)}
                        >
                            {item.icon && (
                                <span aria-hidden data-ms-holdmenu-icon>
                                    {item.icon}
                                </span>
                            )}
                            <span data-ms-holdmenu-label>{item.label}</span>
                        </button>
                    ))}
                </div>
            )}
        </>
    );
}

function positioned({
    x,
    y,
    offsetX,
    offsetY,
    width,
    height,
    scale,
    opacity = 1,
}: {
    x: number;
    y: number;
    offsetX: number;
    offsetY: number;
    width: number;
    height: number;
    scale: number;
    opacity?: number;
}) {
    return {
        position: "fixed" as const,
        left: x,
        top: y,
        width: width,
        height: height,
        zIndex: 9999,
        pointerEvents: "none" as const,
        transform: `translate(${offsetX}px, ${offsetY}px) scale(${scale})`,
        opacity,
        willChange: "transform" as const,
        transformOrigin: "center" as const,
    };
}

function menuPosition({
    x,
    y,
    width,
    height,
    offsetX = 0,
    offsetY = 0,
}: {
    x: number;
    y: number;
    width: number;
    height: number;
    offsetX?: number;
    offsetY?: number;
}) {
    const centerX = x + width / 2;
    const belowY = y + height + 12; // 12px gap below the item
    return {
        position: "fixed" as const,
        left: centerX,
        top: belowY,
        transform: `translate(calc(-50% + ${offsetX}px), ${offsetY}px)`,
        zIndex: 9999,
        willChange: "transform" as const,
    };
}
