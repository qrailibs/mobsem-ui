import {
    forwardRef,
    TextareaHTMLAttributes,
    useCallback,
    useLayoutEffect,
    useRef,
} from "react";
import { usePressFeedback } from "hooks/useFeedback";

import "./styles.css";

export interface TextAreaProps
    extends Omit<
        TextareaHTMLAttributes<HTMLTextAreaElement>,
        "data-ms-textarea"
    > {
    [key: `data-${string}`]: unknown;
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
    ({ value, onInput, rows = 1, ...props }, ref) => {
        const innerRef = useRef<HTMLTextAreaElement | null>(null);
        // No animation on the very first sizing pass (mount) — only on later
        // grow/shrink.
        const mountedRef = useRef(false);
        // When a controlled value change is caused by our own onInput, the
        // layout effect would resize a second time and clobber the animation —
        // this flag lets that redundant pass bail out.
        const skipEffectRef = useRef(false);

        // Merge the forwarded ref with our internal one so callers keep access
        // to the node while we still measure it for auto-grow.
        const setRefs = useCallback(
            (node: HTMLTextAreaElement | null) => {
                innerRef.current = node;
                if (typeof ref === "function") ref(node);
                else if (ref) ref.current = node;
            },
            [ref]
        );

        const resize = useCallback((animate: boolean) => {
            const el = innerRef.current;
            if (!el) return;

            // Current rendered height is the animation's starting point. Using
            // the actual box (not a stored value) keeps us honest when the
            // `max-height` cap clamps the height.
            const prev = el.offsetHeight;

            // Collapse to `auto` to measure the natural content height. Reading
            // `scrollHeight` forces layout but not a paint, so the field never
            // visibly flashes to this height. `auto` is non-interpolable, so
            // this swap can't kick off a phantom `height` transition.
            el.style.height = "auto";
            const target = el.scrollHeight;

            // Mount or same height: commit directly, nothing to animate.
            if (!animate || target === prev) {
                el.style.height = `${target}px`;
                return;
            }

            // Restore the previous height and force a reflow so it becomes the
            // transition's baseline, then set the target — the browser now
            // animates cleanly from prev → target via `transition: height`.
            el.style.height = `${prev}px`;
            void el.offsetHeight;
            el.style.height = `${target}px`;
        }, []);

        // Initial sizing and external/controlled value changes.
        useLayoutEffect(() => {
            if (skipEffectRef.current) {
                skipEffectRef.current = false;
                return;
            }
            resize(mountedRef.current);
            mountedRef.current = true;
        }, [resize, value]);

        const handleInput = (event: React.FormEvent<HTMLTextAreaElement>) => {
            skipEffectRef.current = true;
            resize(true);
            onInput?.(event);
        };

        const pressHandlers = usePressFeedback<HTMLTextAreaElement>(props, {
            skipWhenFocused: true,
        });

        return (
            <textarea
                ref={setRefs}
                data-ms-textarea
                rows={rows}
                value={value}
                onInput={handleInput}
                {...pressHandlers}
                {...props}
            />
        );
    }
);

TextArea.displayName = "TextArea";
