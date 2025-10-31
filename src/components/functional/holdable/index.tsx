import { useState, useRef, useEffect, ReactElement } from "react";
import { createPortal } from "react-dom";

import { useLongPress } from "hooks/useLongPress";
import { PropsWithChildren, PropsWithRef } from "helpers/types";
import { Popover } from "components/semantical";

import "./styles.css";

export interface HoldMenuItem {
    icon?: ReactElement;
    label: string;
    variant?: "default" | "destructive" | "secondary";
    onHandle: () => void;
}

interface HoldableProps extends PropsWithChildren<HTMLElement> {
    render: (props: PropsWithRef<HTMLLIElement>) => ReactElement;
    menu: HoldMenuItem[];
}

const HOLD_MOVE_OFFSET_PCT = 0.06; // 6%
const CLOSE_ANIMATION_MS = 250;
const LONG_PRESS_START_DELAY = 400;
const LONG_PRESS_POP_DELAY = 800;

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
    const [bouncing, setBouncing] = useState(false);
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
    const scrollableParentRef = useRef<HTMLElement | null>(null);
    const originalStylesRef = useRef<{
        overflow?: string;
        overflowX?: string;
        overflowY?: string;
        touchAction?: string;
        pointerEvents?: string;
    }>({});

    // --- Handlers ---
    const handleMove = (clientX: number, clientY: number) => {
        if (!(pressing || opened)) return;
        const dx = (clientX - centerRef.current.x) * HOLD_MOVE_OFFSET_PCT;
        const dy = (clientY - centerRef.current.y) * HOLD_MOVE_OFFSET_PCT;
        setOffset({ x: dx, y: dy });
    };

    const animateOffsetToZero = (durationMs = 400) => {
        // CSS handles the transform transition when data-bounce=true
        if (offsetAnimRef.current) {
            cancelAnimationFrame(offsetAnimRef.current);
            offsetAnimRef.current = null;
        }
        setBouncing(true);
        setOffset({ x: 0, y: 0 });
        window.setTimeout(() => setBouncing(false), durationMs);
    };

    const findScrollableParent = () => {
        let element = itemRef.current?.parentElement;
        while (element && element !== document.body) {
            const style = window.getComputedStyle(element);
            const overflowY = style.overflowY;
            const overflowX = style.overflowX;

            // Check if element has scrollable overflow
            const isScrollable =
                overflowY === "scroll" ||
                overflowY === "auto" ||
                overflowX === "scroll" ||
                overflowX === "auto";

            // Check if element actually has scrollable content
            const hasScrollableContent =
                element.scrollHeight > element.clientHeight ||
                element.scrollWidth > element.clientWidth;

            if (isScrollable && hasScrollableContent) {
                return element;
            }

            element = element.parentElement;
        }
        return null;
    };

    const disableScrollableParent = () => {
        const parent = findScrollableParent();
        if (parent) {
            scrollableParentRef.current = parent;

            // Store original styles
            originalStylesRef.current = {
                overflow: parent.style.overflow,
                overflowX: parent.style.overflowX,
                overflowY: parent.style.overflowY,
                touchAction: parent.style.touchAction,
                pointerEvents: parent.style.pointerEvents,
            };

            // Disable scrolling
            parent.style.overflow = "hidden";
            parent.style.touchAction = "none";
            parent.style.pointerEvents = "none";
        }
    };

    const enableScrollableParent = () => {
        if (scrollableParentRef.current) {
            const parent = scrollableParentRef.current;

            // Restore original styles
            if (originalStylesRef.current.overflow !== undefined) {
                parent.style.overflow = originalStylesRef.current.overflow;
            } else {
                parent.style.removeProperty("overflow");
            }

            if (originalStylesRef.current.overflowX !== undefined) {
                parent.style.overflowX = originalStylesRef.current.overflowX;
            } else {
                parent.style.removeProperty("overflow-x");
            }

            if (originalStylesRef.current.overflowY !== undefined) {
                parent.style.overflowY = originalStylesRef.current.overflowY;
            } else {
                parent.style.removeProperty("overflow-y");
            }

            if (originalStylesRef.current.touchAction !== undefined) {
                parent.style.touchAction =
                    originalStylesRef.current.touchAction;
            } else {
                parent.style.removeProperty("touch-action");
            }

            if (originalStylesRef.current.pointerEvents !== undefined) {
                parent.style.pointerEvents =
                    originalStylesRef.current.pointerEvents;
            } else {
                parent.style.removeProperty("pointer-events");
            }

            scrollableParentRef.current = null;
            originalStylesRef.current = {};
        }
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

        // Re-enable scrolling on parent container
        enableScrollableParent();

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
        delay: LONG_PRESS_POP_DELAY,
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
                // Disable scrolling on parent container when pressing state activates
                disableScrollableParent();
                pressingTimerRef.current = null;
            }, LONG_PRESS_START_DELAY);
        },
        onEnd: () => {
            if (pressingTimerRef.current) {
                window.clearTimeout(pressingTimerRef.current);
                pressingTimerRef.current = null;
            }

            // Re-enable scrolling on parent container if not opened
            if (!opened) {
                enableScrollableParent();
            }

            if (opened) {
                setPressing(false);
                animateOffsetToZero();
                return;
            }

            // Only show closing animation if we were actually in pressing state
            if (pressing) {
                setPressing(false);
                setPressingClosing(true);
                setOffset({ x: 0, y: 0 });
                setTimeout(() => setPressingClosing(false), CLOSE_ANIMATION_MS);
            } else {
                // Quick click - just reset
                setPressing(false);
            }
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

        const onGlobalEnd = () => {
            // Only bounce back; do not close on release
            animateOffsetToZero();
        };

        document.addEventListener("keydown", onEscape);
        document.addEventListener("mousemove", onGlobalMove);
        document.addEventListener("touchmove", onGlobalMove);
        document.addEventListener("mouseup", onGlobalEnd);
        document.addEventListener("touchend", onGlobalEnd);
        document.body.style.overflow = "hidden";

        return () => {
            document.removeEventListener("keydown", onEscape);
            document.removeEventListener("mousemove", onGlobalMove);
            document.removeEventListener("touchmove", onGlobalMove);
            document.removeEventListener("mouseup", onGlobalEnd);
            document.removeEventListener("touchend", onGlobalEnd);
            document.body.style.overflow = "";
        };
    }, [opened]);

    // Cleanup any ongoing offset animation on unmount
    useEffect(() => {
        return () => {
            if (offsetAnimRef.current)
                cancelAnimationFrame(offsetAnimRef.current);
            // Ensure scrollable parent is re-enabled on unmount
            enableScrollableParent();
        };
    }, []);

    // --- Render ---
    const portalRoot = document.getElementById("portal-root");

    return (
        <>
            {render({
                ref: itemRef,
                role: "listitem",
                "data-ms-holdable": true,
                "data-state": "idle",
                ...longPressBindings,
                ...restProps,
            })}

            {portalRoot &&
                (pressing || opened || pressingClosing) &&
                createPortal(
                    <>
                        {/* Floating copy rendered on top while opened */}
                        {render({
                            "aria-hidden": true,
                            "data-ms-holdable": true,
                            "data-state": pressing
                                ? "pressing"
                                : opened
                                ? "active"
                                : pressingClosing
                                ? "closing"
                                : "idle",
                            "data-bounce": bouncing ? "true" : undefined,
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
                                opacity:
                                    pressing || (opened && !closing) ? 1 : 0,
                            }),
                        })}

                        {/* Context menu */}
                        {opened && menu && menu.length > 0 && (
                            <div
                                role="menu"
                                data-ms-holdmenu
                                data-open={opened && !closing}
                                data-animation={closing ? "closing" : undefined}
                                data-bounce={bouncing ? "true" : undefined}
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
                                        aria-label={item.label}
                                        data-ms-holdmenu-item
                                        data-variant={item.variant ?? "default"}
                                        onClick={() =>
                                            handleSelect(item.onHandle)
                                        }
                                    >
                                        {item.icon && (
                                            <span role="img">{item.icon}</span>
                                        )}
                                        <span>{item.label}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </>,
                    portalRoot
                )}

            {opened && (
                <Popover
                    visible={opened}
                    data-closing={closing}
                    data-ms-holdoverlay
                    onClick={handleClose}
                />
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
        left: x,
        top: y,
        width: width,
        height: height,
        transform: `translate(${offsetX}px, ${offsetY}px) scale(${scale})`,
        opacity,
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
        left: centerX,
        top: belowY,
        transform: `translate(calc(-50% + ${offsetX}px), ${offsetY}px)`,
    };
}
