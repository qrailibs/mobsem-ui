import {
    forwardRef,
    useCallback,
    useLayoutEffect,
    useRef,
    useState,
    Children,
} from "react";
import { PropsWithChildren } from "helpers/types";
import { vibrate } from "hooks/useFeedback";
import { GalleryProvider } from "../image/gallery";

import "./styles.css";

export interface CarouselProps
    extends Omit<PropsWithChildren<HTMLDivElement>, "onChange"> {
    /** Controlled active slide index. */
    index?: number;
    /** Uncontrolled starting slide index. */
    defaultIndex?: number;
    onChange?: (index: number) => void;
    /** Gap between slides, in px. */
    gap?: number;
    /** Show pagination dots. Defaults to true. */
    dots?: boolean;
}

// Commit to the next slide past this fraction of the track width, or on a flick.
const DISTANCE_RATIO = 0.2;
const VELOCITY_THRESHOLD = 0.4; // px/ms
const EDGE_RESISTANCE = 0.35; // rubber-band factor past the first/last slide

const CarouselRoot = forwardRef<HTMLDivElement, CarouselProps>(
    (
        {
            children,
            index,
            defaultIndex = 0,
            onChange,
            gap = 0,
            dots = true,
            ...props
        },
        ref
    ) => {
        const slides = Children.toArray(children);
        const count = slides.length;

        const isControlled = index !== undefined;
        const [internal, setInternal] = useState(defaultIndex);
        const active = Math.min(
            count - 1,
            Math.max(0, isControlled ? (index as number) : internal)
        );

        const [dragging, setDragging] = useState(false);
        const [offset, setOffset] = useState(0); // live drag offset in px
        const [width, setWidth] = useState(0);

        const viewportRef = useRef<HTMLDivElement | null>(null);
        const startRef = useRef({ x: 0, y: 0, t: 0 });
        const lastRef = useRef({ x: 0, t: 0 });
        // `null` until we know whether the gesture is a horizontal swipe.
        const axisRef = useRef<null | "x" | "y">(null);
        // Set once a real drag happens, so the trailing click doesn't open an
        // image that was only swiped past.
        const movedRef = useRef(false);
        const activeRef = useRef(active);
        activeRef.current = active;

        const setViewportRef = useCallback(
            (node: HTMLDivElement | null) => {
                viewportRef.current = node;
                if (typeof ref === "function") ref(node);
                else if (ref) ref.current = node;
            },
            [ref]
        );

        // Track the viewport width so a slide is always exactly one page wide.
        useLayoutEffect(() => {
            const el = viewportRef.current;
            if (!el) return;
            const measure = () => setWidth(el.clientWidth);
            measure();
            const ro = new ResizeObserver(measure);
            ro.observe(el);
            return () => ro.disconnect();
        }, []);

        const goTo = useCallback(
            (next: number) => {
                const clamped = Math.min(count - 1, Math.max(0, next));
                if (clamped !== activeRef.current) vibrate(10);
                if (!isControlled) setInternal(clamped);
                onChange?.(clamped);
            },
            [count, isControlled, onChange]
        );

        const step = width + gap;

        const onPointerDown = (e: React.PointerEvent) => {
            if (count <= 1) return;
            (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
            startRef.current = { x: e.clientX, y: e.clientY, t: e.timeStamp };
            lastRef.current = { x: e.clientX, t: e.timeStamp };
            axisRef.current = null;
            movedRef.current = false;
            setDragging(true);
        };

        const onPointerMove = (e: React.PointerEvent) => {
            if (!dragging) return;
            const dx = e.clientX - startRef.current.x;
            const dy = e.clientY - startRef.current.y;

            // Lock the axis on the first meaningful movement: a vertical intent
            // (page scroll) releases the carousel instead of fighting it.
            if (axisRef.current === null) {
                if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
                axisRef.current = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
                if (axisRef.current === "y") {
                    setDragging(false);
                    return;
                }
            }

            movedRef.current = true;
            lastRef.current = { x: e.clientX, t: e.timeStamp };
            // Add resistance at the ends so the track feels bounded, not stuck.
            let d = dx;
            const atStart = active === 0 && d > 0;
            const atEnd = active === count - 1 && d < 0;
            if (atStart || atEnd) d *= EDGE_RESISTANCE;
            setOffset(d);
        };

        const endDrag = (e: React.PointerEvent) => {
            if (!dragging) {
                axisRef.current = null;
                return;
            }
            setDragging(false);

            const dx = e.clientX - startRef.current.x;
            const dt = Math.max(1, e.timeStamp - lastRef.current.t);
            const velocity = (e.clientX - lastRef.current.x) / dt;

            let next = active;
            const passedDistance = Math.abs(dx) > step * DISTANCE_RATIO;
            const flicked = Math.abs(velocity) > VELOCITY_THRESHOLD;
            if (passedDistance || flicked) {
                next = dx < 0 ? active + 1 : active - 1;
            }
            // Resetting the offset while the (non-dragging) track transition is
            // live is what produces the smooth spring back / snap.
            setOffset(0);
            goTo(next);
        };

        // Swallow the click that follows a swipe so a slide's own tap handlers
        // (e.g. an openable <Image>) don't fire mid-gesture.
        const onClickCapture = (e: React.MouseEvent) => {
            if (movedRef.current) {
                e.preventDefault();
                e.stopPropagation();
                movedRef.current = false;
            }
        };

        const translate = -active * step + offset;

        return (
            <GalleryProvider>
                <div data-ms-carousel {...props}>
                    <div
                        ref={setViewportRef}
                        data-ms-carousel-viewport
                        onPointerDown={onPointerDown}
                        onPointerMove={onPointerMove}
                        onPointerUp={endDrag}
                        onPointerCancel={endDrag}
                        onClickCapture={onClickCapture}
                    >
                        <div
                            data-ms-carousel-track
                            data-dragging={dragging || undefined}
                            style={{
                                gap: `${gap}px`,
                                transform: `translate3d(${translate}px, 0, 0)`,
                            }}
                        >
                            {slides.map((slide, i) => (
                                <div
                                    key={i}
                                    data-ms-carousel-slide
                                    aria-hidden={i !== active}
                                    style={{
                                        width: width ? `${width}px` : "100%",
                                    }}
                                >
                                    {slide}
                                </div>
                            ))}
                        </div>
                    </div>

                    {dots && count > 1 && (
                        <div data-ms-carousel-dots role="tablist">
                            {slides.map((_, i) => (
                                <button
                                    key={i}
                                    type="button"
                                    data-ms-carousel-dot
                                    data-active={i === active || undefined}
                                    role="tab"
                                    aria-selected={i === active}
                                    aria-label={`Go to slide ${i + 1}`}
                                    onClick={() => goTo(i)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </GalleryProvider>
        );
    }
);

CarouselRoot.displayName = "Carousel";

/* ------------------------------------------------------------------ */

export interface CarouselItemProps extends PropsWithChildren<HTMLDivElement> {}

export const CarouselItem = forwardRef<HTMLDivElement, CarouselItemProps>(
    ({ children, ...props }, ref) => (
        <div ref={ref} data-ms-carousel-item {...props}>
            {children}
        </div>
    )
);

CarouselItem.displayName = "Carousel.Item";

// Compound API: <Carousel><Carousel.Item /></Carousel>
type CarouselComponent = typeof CarouselRoot & { Item: typeof CarouselItem };

export const Carousel = CarouselRoot as CarouselComponent;
Carousel.Item = CarouselItem;
