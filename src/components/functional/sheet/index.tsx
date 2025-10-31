import { useState, useRef, useEffect, forwardRef } from "react";
import { createPortal } from "react-dom";
import { PropsWithChildren } from "helpers/types";
import { Popover } from "components/semantical";

import "./styles.css";

const CLOSE_THRESHOLD = 40; // % of sheet height to trigger close
const FULLSCREEN_THRESHOLD = 200; // pixels dragged up to trigger fullscreen
const SNAP_DURATION = 300; // ms
const CLOSE_ANIMATION_MS = 250;

export interface SheetProps extends PropsWithChildren<HTMLDivElement> {
    open?: boolean;
    onClose?: () => void;
    defaultHeight?: number; // Percentage of viewport (0-100)
}

export const Sheet = forwardRef<HTMLDivElement, SheetProps>(
    (
        { children, open = false, onClose, defaultHeight = 50, ...props },
        ref
    ) => {
        const [isOpen, setIsOpen] = useState(open);
        const [isClosing, setIsClosing] = useState(false);
        const [isFullscreen, setIsFullscreen] = useState(false);
        const [isDragging, setIsDragging] = useState(false);
        const [dragOffset, setDragOffset] = useState(0);
        const [isAnimating, setIsAnimating] = useState(false);
        const [viewportHeight, setViewportHeight] = useState(
            window.innerHeight
        );
        const [closingHeight, setClosingHeight] = useState<number | null>(null);

        const sheetRef = useRef<HTMLDivElement>(null);
        const startYRef = useRef<number>(0);
        const startHeightRef = useRef<number>(0);
        const startFullscreenRef = useRef<boolean>(false);
        const prevOpenRef = useRef(open);

        // Sync with prop changes
        useEffect(() => {
            // Opening
            if (open && !prevOpenRef.current) {
                setIsOpen(true);
            }
            // Closing - trigger animation instead of immediate close
            else if (!open && prevOpenRef.current && isOpen) {
                // Capture current height before closing
                if (sheetRef.current) {
                    setClosingHeight(sheetRef.current.offsetHeight);
                }

                // Reset states first
                setIsAnimating(false);
                setIsDragging(false);
                setDragOffset(0);

                // Use requestAnimationFrame to ensure animation is visible
                requestAnimationFrame(() => {
                    setIsClosing(true);

                    setTimeout(() => {
                        setIsOpen(false);
                        setIsClosing(false);
                        setIsFullscreen(false);
                        setClosingHeight(null);
                        onClose?.();
                    }, CLOSE_ANIMATION_MS);
                });
            }

            prevOpenRef.current = open;
        }, [open, isOpen, onClose]);

        // Update viewport height on resize (critical for mobile browsers)
        useEffect(() => {
            const updateHeight = () => {
                setViewportHeight(window.innerHeight);
            };

            updateHeight();
            window.addEventListener("resize", updateHeight);

            return () => {
                window.removeEventListener("resize", updateHeight);
            };
        }, []);

        // Lock body scroll when sheet is open
        useEffect(() => {
            if (isOpen) {
                document.body.style.overflow = "hidden";
                return () => {
                    document.body.style.overflow = "";
                };
            }
        }, [isOpen]);

        const getSheetHeight = () => {
            if (!sheetRef.current) return 0;
            return sheetRef.current.offsetHeight;
        };

        const handleClose = () => {
            // Capture current height before closing to prevent height changes during animation
            if (sheetRef.current) {
                setClosingHeight(sheetRef.current.offsetHeight);
            }

            // Reset states first
            setIsAnimating(false);
            setIsDragging(false);
            setDragOffset(0);

            // Use requestAnimationFrame to ensure browser renders the reset state
            // before applying the closing animation - this makes the transition visible
            requestAnimationFrame(() => {
                setIsClosing(true);

                setTimeout(() => {
                    setIsOpen(false);
                    setIsClosing(false);
                    setIsFullscreen(false);
                    setClosingHeight(null);
                    onClose?.();
                }, CLOSE_ANIMATION_MS);
            });
        };

        const handleDragStart = (clientY: number) => {
            if (!sheetRef.current) return;

            setIsDragging(true);
            startYRef.current = clientY;
            startHeightRef.current = getSheetHeight();
            startFullscreenRef.current = isFullscreen;
        };

        const handleDragMove = (clientY: number) => {
            if (!isDragging) return;

            const deltaY = clientY - startYRef.current;

            // Dragging down from fullscreen: allow it to shrink
            if (startFullscreenRef.current && deltaY > 0) {
                setDragOffset(deltaY);
            }
            // Dragging up from default: allow it to expand
            else if (!startFullscreenRef.current && deltaY < 0) {
                setDragOffset(deltaY);
            }
            // Dragging down from default: move down for closing
            else if (!startFullscreenRef.current && deltaY > 0) {
                setDragOffset(deltaY);
            }
            // Dragging up from fullscreen: don't allow (already at max)
            else {
                setDragOffset(0);
            }
        };

        const handleDragEnd = () => {
            if (!isDragging) return;

            setIsDragging(false);

            const sheetHeight = startHeightRef.current;

            // Dragging down from default state - check if should close
            if (!startFullscreenRef.current && dragOffset > 0) {
                const draggedPercent = (dragOffset / sheetHeight) * 100;
                if (draggedPercent > CLOSE_THRESHOLD) {
                    handleClose();
                    return; // Don't set isAnimating if closing
                } else {
                    setIsAnimating(true);
                    setDragOffset(0);
                }
            }
            // Dragging up from default state - check if should go fullscreen
            else if (!startFullscreenRef.current && dragOffset < 0) {
                setIsAnimating(true);
                if (Math.abs(dragOffset) > FULLSCREEN_THRESHOLD) {
                    setIsFullscreen(true);
                    setDragOffset(0);
                } else {
                    setDragOffset(0);
                }
            }
            // Dragging down from fullscreen - check if should go back to default
            else if (startFullscreenRef.current && dragOffset > 0) {
                setIsAnimating(true);
                const maxHeight = viewportHeight - 40;
                const defaultHeightPx = viewportHeight * (defaultHeight / 100);
                const draggedPercent =
                    (dragOffset / (maxHeight - defaultHeightPx)) * 100;

                if (draggedPercent > CLOSE_THRESHOLD) {
                    setIsFullscreen(false);
                    setDragOffset(0);
                } else {
                    setDragOffset(0);
                }
            }
            // Default: snap back
            else {
                setIsAnimating(true);
                setDragOffset(0);
            }

            setTimeout(() => {
                setIsAnimating(false);
            }, SNAP_DURATION);
        };

        // Touch handlers
        const handleTouchStart = (e: React.TouchEvent) => {
            const touch = e.touches[0];
            handleDragStart(touch.clientY);
        };

        const handleTouchMove = (e: React.TouchEvent) => {
            const touch = e.touches[0];
            handleDragMove(touch.clientY);
        };

        const handleTouchEnd = () => {
            handleDragEnd();
        };

        // Mouse handlers (for desktop testing)
        const handleMouseDown = (e: React.MouseEvent) => {
            handleDragStart(e.clientY);
        };

        useEffect(() => {
            if (!isDragging) return;

            const handleMouseMove = (e: MouseEvent) => {
                handleDragMove(e.clientY);
            };

            const handleMouseUp = () => {
                handleDragEnd();
            };

            document.addEventListener("mousemove", handleMouseMove);
            document.addEventListener("mouseup", handleMouseUp);

            return () => {
                document.removeEventListener("mousemove", handleMouseMove);
                document.removeEventListener("mouseup", handleMouseUp);
            };
        }, [isDragging, dragOffset, isFullscreen]);

        // Keyboard support
        useEffect(() => {
            if (!isOpen) return;

            const handleKeyDown = (e: KeyboardEvent) => {
                if (e.key === "Escape") {
                    handleClose();
                }
            };

            document.addEventListener("keydown", handleKeyDown);
            return () => {
                document.removeEventListener("keydown", handleKeyDown);
            };
        }, [isOpen]);

        const portalRoot = document.getElementById("portal-root");

        if (!portalRoot || !isOpen) {
            return null;
        }

        return createPortal(
            <>
                {/* Backdrop/Overlay using Popover component */}
                <Popover
                    visible={isOpen}
                    data-closing={isClosing}
                    onClick={handleClose}
                />

                {/* Sheet Container */}
                <div
                    ref={sheetRef}
                    data-ms-sheet
                    data-open={isOpen}
                    data-closing={isClosing}
                    data-fullscreen={isFullscreen}
                    data-dragging={isDragging}
                    data-animating={isAnimating}
                    role="dialog"
                    aria-modal="true"
                    style={
                        {
                            "--sheet-viewport-height": `${viewportHeight}px`,
                            "--sheet-default-height": `${
                                (viewportHeight * defaultHeight) / 100
                            }px`,
                            "--sheet-drag-offset": `${dragOffset}px`,
                            "--sheet-closing-height": closingHeight
                                ? `${closingHeight}px`
                                : undefined,
                        } as React.CSSProperties
                    }
                    {...props}
                >
                    {/* Drag Handle */}
                    <div
                        data-ms-sheet-handle
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                        onMouseDown={handleMouseDown}
                        aria-label="Drag handle"
                        role="button"
                        tabIndex={0}
                    >
                        <div data-ms-sheet-handle-bar />
                    </div>

                    {/* Content */}
                    <div data-ms-sheet-content ref={ref}>
                        {children}
                    </div>
                </div>
            </>,
            portalRoot
        );
    }
);

Sheet.displayName = "Sheet";
