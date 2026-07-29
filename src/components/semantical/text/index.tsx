import {
    forwardRef,
    ReactNode,
    useLayoutEffect,
    useRef,
    useState,
} from "react";
import { PropsWithChildren } from "helpers/types";

import "./styles.css";

/**
 * Inline text primitive with predefined, iOS-flavoured sizes. Headings still
 * belong to <Caption>; <Text> covers body copy, labels and captions.
 */
export type TextSize =
    | "title"
    | "headline"
    | "body"
    | "callout"
    | "subheadline"
    | "footnote"
    | "caption";

export type TextWeight = "regular" | "medium" | "semibold" | "bold";

export interface TextProps extends PropsWithChildren<HTMLSpanElement> {
    size?: TextSize;
    weight?: TextWeight;
    /** Dim the text to the secondary neutral colour. */
    muted?: boolean;
    /** Tabular figures so digits keep a constant width (counters, tables). */
    numeric?: boolean;
    /**
     * Cross-fade the content whenever it changes: the outgoing text blurs out
     * downward while the incoming text blurs in from the top. Best for short,
     * frequently-changing values (numbers, statuses).
     */
    animated?: boolean;
}

interface Part {
    id: number;
    node: ReactNode;
}

export const Text = forwardRef<HTMLSpanElement, TextProps>(
    (
        { children, size = "body", weight, muted, numeric, animated, ...props },
        ref
    ) => {
        const idRef = useRef(0);
        const prevRef = useRef<ReactNode>(children);
        const [current, setCurrent] = useState<Part>(() => ({
            id: 0,
            node: children,
        }));
        const [exiting, setExiting] = useState<Part[]>([]);

        // On every content change, retire the current part to the exiting list
        // (animating out) and promote the new content to current (animating in).
        useLayoutEffect(() => {
            if (!animated) return;
            if (Object.is(prevRef.current, children)) return;
            prevRef.current = children;
            setCurrent((prevCurrent) => {
                setExiting((list) => [...list, prevCurrent]);
                return { id: (idRef.current += 1), node: children };
            });
        }, [children, animated]);

        const removeExiting = (id: number) =>
            setExiting((list) => list.filter((p) => p.id !== id));

        const shared = {
            ref,
            "data-ms-text": true,
            "data-size": size,
            "data-weight": weight,
            "data-muted": muted || undefined,
            "data-numeric": numeric || undefined,
            ...props,
        } as const;

        if (!animated) {
            return <span {...shared}>{children}</span>;
        }

        return (
            <span {...shared} data-animated>
                {exiting.map((part) => (
                    <span
                        key={part.id}
                        data-ms-text-part
                        data-state="exit"
                        onAnimationEnd={() => removeExiting(part.id)}
                    >
                        {part.node}
                    </span>
                ))}
                <span
                    key={current.id}
                    data-ms-text-part
                    // The initial content mounts without an entrance animation.
                    data-state={current.id === 0 ? undefined : "enter"}
                >
                    {current.node}
                </span>
            </span>
        );
    }
);

Text.displayName = "Text";
