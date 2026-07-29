import {
    useCallback,
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
} from "react";
import { createPortal } from "react-dom";
import { vibrate } from "hooks/useFeedback";

export interface MediaItem {
    src: string;
    srcSet?: string;
    sizes?: string;
    alt: string;
}

interface MediaViewerProps {
    items: MediaItem[];
    index: number;
    onClose: () => void;
}

const MIN_SCALE = 1;
const MAX_SCALE = 4;
const DOUBLE_TAP_SCALE = 2.5;
const DOUBLE_TAP_MS = 300;
const CLOSE_DRAG_THRESHOLD = 90; // px dragged down (while unzoomed) to close
const CLOSE_ANIMATION_MS = 220;
const PAGE_DISTANCE_RATIO = 0.22; // fraction of a page to commit a swipe
const PAGE_VELOCITY = 0.35; // px/ms flick to commit a swipe
const EDGE_RESISTANCE = 0.35; // rubber-band factor past the first/last page

interface Transform {
    scale: number;
    x: number;
    y: number;
}

interface Point {
    x: number;
    y: number;
}

const IDENTITY: Transform = { scale: 1, x: 0, y: 0 };

const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);
const midpoint = (a: Point, b: Point) => ({
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
});

/**
 * Full-screen media viewer with three coexisting gestures, arbitrated per
 * pointer sequence: pinch/pan-to-zoom, horizontal swipe between items, and
 * drag-down-to-dismiss. When more than one item is present a thumbnail strip
 * lets you jump straight to any image.
 */
export function MediaViewer({
    items,
    index: initialIndex,
    onClose,
}: MediaViewerProps) {
    const [index, setIndex] = useState(initialIndex);
    const [transform, setTransform] = useState<Transform>(IDENTITY);
    const [pageOffset, setPageOffset] = useState(0); // live horizontal drag, px
    const [closeDrag, setCloseDrag] = useState(0); // live dismiss drag, px
    const [dragging, setDragging] = useState(false);
    const [entering, setEntering] = useState(true);
    const [closing, setClosing] = useState(false);
    const [zoomAnimating, setZoomAnimating] = useState(false);

    const [width, setWidth] = useState(
        typeof window !== "undefined" ? window.innerWidth : 0,
    );

    const viewerRef = useRef<HTMLDivElement>(null);
    const imgRefs = useRef<(HTMLImageElement | null)[]>([]);
    const thumbStripRef = useRef<HTMLDivElement>(null);

    const transformRef = useRef(transform);
    transformRef.current = transform;
    const indexRef = useRef(index);
    indexRef.current = index;

    const pointers = useRef(new Map<number, Point>());
    // Which gesture the current pointer sequence resolved to.
    const mode = useRef<null | "pinch" | "pan" | "page" | "close">(null);
    const pinch = useRef<{
        startDist: number;
        startScale: number;
        startMid: Point;
        startX: number;
        startY: number;
    } | null>(null);
    const pan = useRef<{
        startX: number;
        startY: number;
        origin: Transform;
    } | null>(null);
    const swipe = useRef<{
        startX: number;
        lastX: number;
        lastT: number;
    } | null>(null);
    const lastTap = useRef<{ t: number; x: number; y: number } | null>(null);

    const count = items.length;

    /** Clamp a transform to sane scale + keep the image within its own edges. */
    const clamp = useCallback((t: Transform): Transform => {
        const el = imgRefs.current[indexRef.current];
        const scale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, t.scale));
        if (!el) return { ...t, scale };
        const maxX = (el.offsetWidth * (scale - 1)) / 2;
        const maxY = (el.offsetHeight * (scale - 1)) / 2;
        return {
            scale,
            x: Math.max(-maxX, Math.min(maxX, t.x)),
            y: Math.max(-maxY, Math.min(maxY, t.y)),
        };
    }, []);

    const animateZoom = useCallback((t: Transform) => {
        setZoomAnimating(true);
        setTransform(t);
        window.setTimeout(() => setZoomAnimating(false), 220);
    }, []);

    const requestClose = useCallback(() => {
        setClosing(true);
        window.setTimeout(onClose, CLOSE_ANIMATION_MS);
    }, [onClose]);

    const goTo = useCallback(
        (next: number) => {
            const clamped = Math.min(count - 1, Math.max(0, next));
            if (clamped !== indexRef.current) {
                vibrate(10);
                // A fresh page always starts un-zoomed.
                setTransform(IDENTITY);
                setIndex(clamped);
            }
            setPageOffset(0);
        },
        [count],
    );

    // Track viewport width so a page is exactly one screen wide.
    useLayoutEffect(() => {
        const measure = () => setWidth(window.innerWidth);
        measure();
        window.addEventListener("resize", measure);
        return () => window.removeEventListener("resize", measure);
    }, []);

    // Fade/scale in on mount.
    useEffect(() => {
        const raf = requestAnimationFrame(() => setEntering(false));
        return () => cancelAnimationFrame(raf);
    }, []);

    // Body-scroll lock + arrow-key / Escape navigation.
    useEffect(() => {
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") requestClose();
            else if (e.key === "ArrowRight") goTo(indexRef.current + 1);
            else if (e.key === "ArrowLeft") goTo(indexRef.current - 1);
        };
        document.addEventListener("keydown", onKey);
        return () => {
            document.body.style.overflow = prev;
            document.removeEventListener("keydown", onKey);
        };
    }, [requestClose, goTo]);

    // Keep the active thumbnail scrolled into view.
    useEffect(() => {
        const strip = thumbStripRef.current;
        const active = strip?.querySelector<HTMLElement>("[data-active]");
        active?.scrollIntoView({
            behavior: "smooth",
            block: "nearest",
            inline: "center",
        });
    }, [index]);

    const onPointerDown = (e: React.PointerEvent) => {
        (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
        pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
        setDragging(true);
        setZoomAnimating(false);

        const pts = Array.from(pointers.current.values());
        if (pts.length === 2) {
            const t = transformRef.current;
            mode.current = "pinch";
            pinch.current = {
                startDist: distance(pts[0], pts[1]),
                startScale: t.scale,
                startMid: midpoint(pts[0], pts[1]),
                startX: t.x,
                startY: t.y,
            };
            swipe.current = null;
            return;
        }

        if (transformRef.current.scale > 1) {
            // Already zoomed → a single finger pans the image.
            mode.current = "pan";
            pan.current = {
                startX: e.clientX,
                startY: e.clientY,
                origin: transformRef.current,
            };
        } else {
            // Axis undecided until the first meaningful movement.
            mode.current = null;
            swipe.current = {
                startX: e.clientX,
                lastX: e.clientX,
                lastT: e.timeStamp,
            };
            pan.current = {
                startX: e.clientX,
                startY: e.clientY,
                origin: transformRef.current,
            };
        }
    };

    const onPointerMove = (e: React.PointerEvent) => {
        if (!pointers.current.has(e.pointerId)) return;
        pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
        const pts = Array.from(pointers.current.values());

        if (mode.current === "pinch" && pts.length >= 2 && pinch.current) {
            const p = pinch.current;
            const dist = distance(pts[0], pts[1]);
            const mid = midpoint(pts[0], pts[1]);
            setTransform(
                clamp({
                    scale: p.startScale * (dist / p.startDist),
                    x: p.startX + (mid.x - p.startMid.x),
                    y: p.startY + (mid.y - p.startMid.y),
                }),
            );
            return;
        }

        if (mode.current === "pan" && pan.current) {
            const p = pan.current;
            setTransform(
                clamp({
                    scale: p.origin.scale,
                    x: p.origin.x + (e.clientX - p.startX),
                    y: p.origin.y + (e.clientY - p.startY),
                }),
            );
            return;
        }

        const start = pan.current;
        if (!start) return;
        const dx = e.clientX - start.startX;
        const dy = e.clientY - start.startY;

        // Resolve the axis for a single-finger, un-zoomed gesture.
        if (mode.current === null) {
            if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
            mode.current = Math.abs(dx) > Math.abs(dy) ? "page" : "close";
        }

        if (mode.current === "page") {
            if (swipe.current) {
                swipe.current.lastX = e.clientX;
                swipe.current.lastT = e.timeStamp;
            }
            const atStart = index === 0 && dx > 0;
            const atEnd = index === count - 1 && dx < 0;
            setPageOffset(atStart || atEnd ? dx * EDGE_RESISTANCE : dx);
        } else if (mode.current === "close") {
            setCloseDrag(Math.max(0, dy));
        }
    };

    const onPointerUp = (e: React.PointerEvent) => {
        const existed = pointers.current.delete(e.pointerId);
        const remaining = pointers.current.size;
        if (remaining > 0) {
            // Lifting one finger of a pinch → hand off to a pan with the rest.
            if (mode.current === "pinch") {
                const pt = Array.from(pointers.current.values())[0];
                mode.current = "pan";
                pan.current = {
                    startX: pt.x,
                    startY: pt.y,
                    origin: transformRef.current,
                };
                pinch.current = null;
            }
            return;
        }

        setDragging(false);
        const finishedMode = mode.current;
        mode.current = null;

        if (finishedMode === "close") {
            if (closeDrag > CLOSE_DRAG_THRESHOLD) requestClose();
            else setCloseDrag(0);
            return;
        }

        if (finishedMode === "page" && swipe.current) {
            const s = swipe.current;
            const dx = e.clientX - s.startX;
            const dt = Math.max(1, e.timeStamp - s.lastT);
            const velocity = (e.clientX - s.lastX) / dt;
            const passed = Math.abs(dx) > width * PAGE_DISTANCE_RATIO;
            const flicked = Math.abs(velocity) > PAGE_VELOCITY;
            if (passed || flicked) goTo(index + (dx < 0 ? 1 : -1));
            else setPageOffset(0);
            return;
        }

        if (finishedMode === "pinch" || finishedMode === "pan") {
            const t = transformRef.current;
            if (t.scale <= MIN_SCALE + 0.001) animateZoom(IDENTITY);
            else setTransform(clamp(t));
        }

        // Tap handling (no resolved drag): double-tap on the image zooms; a
        // single tap on the surrounding backdrop dismisses.
        if (finishedMode === null && existed && pan.current) {
            const moved =
                Math.abs(e.clientX - pan.current.startX) +
                    Math.abs(e.clientY - pan.current.startY) <
                8;
            if (moved) {
                const el = imgRefs.current[indexRef.current];
                const r = el?.getBoundingClientRect();
                const onImage =
                    r &&
                    e.clientX >= r.left &&
                    e.clientX <= r.right &&
                    e.clientY >= r.top &&
                    e.clientY <= r.bottom;
                if (!onImage) {
                    pan.current = null;
                    requestClose();
                    return;
                }
                const now = Date.now();
                const prev = lastTap.current;
                if (
                    prev &&
                    now - prev.t < DOUBLE_TAP_MS &&
                    Math.abs(e.clientX - prev.x) < 24 &&
                    Math.abs(e.clientY - prev.y) < 24
                ) {
                    lastTap.current = null;
                    toggleZoom(e.clientX, e.clientY);
                } else {
                    lastTap.current = { t: now, x: e.clientX, y: e.clientY };
                }
            }
        }
        pan.current = null;
    };

    const toggleZoom = (clientX: number, clientY: number) => {
        const el = imgRefs.current[indexRef.current];
        if (!el) return;
        if (transformRef.current.scale > 1) {
            animateZoom(IDENTITY);
            return;
        }
        const rect = el.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        animateZoom(
            clamp({
                scale: DOUBLE_TAP_SCALE,
                x: (cx - clientX) * (DOUBLE_TAP_SCALE - 1),
                y: (cy - clientY) * (DOUBLE_TAP_SCALE - 1),
            }),
        );
    };

    const onWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        const t = transformRef.current;
        const next = clamp({ ...t, scale: t.scale - e.deltaY * 0.003 });
        setTransform(next.scale <= MIN_SCALE + 0.001 ? IDENTITY : next);
    };

    const portalRoot =
        typeof document !== "undefined"
            ? document.getElementById("portal-root")
            : null;
    if (!portalRoot) return null;

    const dragProgress = Math.min(closeDrag / 240, 1);
    const backdropOpacity = Math.min(1 - dragProgress * 0.7, 0.9);
    const trackX = -index * width + pageOffset;

    return createPortal(
        <div
            ref={viewerRef}
            data-ms-image-viewer
            data-entering={entering || undefined}
            data-closing={closing || undefined}
            data-has-thumbs={count > 1 || undefined}
            role="dialog"
            aria-modal="true"
            aria-label={items[index]?.alt || "Image"}
            style={
                {
                    "--viewer-backdrop-opacity": backdropOpacity,
                } as React.CSSProperties
            }
        >
            <button
                data-ms-image-viewer-close
                type="button"
                aria-label="Close"
                onClick={requestClose}
            >
                <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                >
                    <path d="M18 6 6 18M6 6l12 12" />
                </svg>
            </button>

            {count > 1 && (
                <span data-ms-image-viewer-counter>
                    {index + 1} / {count}
                </span>
            )}

            <div
                data-ms-image-viewer-stage
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
                onWheel={onWheel}
                onClick={(e) => {
                    // Bare tap on the empty stage (not the image) closes.
                    if (e.target === e.currentTarget) requestClose();
                }}
            >
                <div
                    data-ms-image-viewer-track
                    data-dragging={dragging || undefined}
                    style={{
                        transform: `translate3d(${trackX}px, ${closeDrag}px, 0)`,
                    }}
                >
                    {items.map((item, i) => {
                        const isCurrent = i === index;
                        return (
                            <div
                                key={i}
                                data-ms-image-viewer-slide
                                style={{
                                    width: width ? `${width}px` : "100vw",
                                }}
                            >
                                <img
                                    ref={(node) => {
                                        imgRefs.current[i] = node;
                                    }}
                                    data-ms-image-viewer-img
                                    data-animating={
                                        (isCurrent && zoomAnimating) ||
                                        undefined
                                    }
                                    data-zoomed={
                                        (isCurrent && transform.scale > 1) ||
                                        undefined
                                    }
                                    src={item.src}
                                    srcSet={item.srcSet}
                                    sizes={item.sizes}
                                    alt={item.alt}
                                    draggable={false}
                                    loading={isCurrent ? undefined : "lazy"}
                                    style={
                                        isCurrent
                                            ? {
                                                  transform: `translate3d(${transform.x}px, ${transform.y}px, 0) scale(${transform.scale})`,
                                              }
                                            : undefined
                                    }
                                />
                            </div>
                        );
                    })}
                </div>
            </div>

            {count > 1 && (
                <div
                    ref={thumbStripRef}
                    data-ms-image-viewer-thumbs
                    onPointerDown={(e) => e.stopPropagation()}
                >
                    {items.map((item, i) => (
                        <button
                            key={i}
                            type="button"
                            data-ms-image-viewer-thumb
                            data-active={i === index || undefined}
                            aria-label={`View image ${i + 1}`}
                            onClick={() => goTo(i)}
                        >
                            <img
                                src={item.src}
                                alt=""
                                loading="lazy"
                                draggable={false}
                            />
                        </button>
                    ))}
                </div>
            )}
        </div>,
        portalRoot,
    );
}
