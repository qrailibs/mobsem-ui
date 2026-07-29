import { forwardRef, useCallback, useRef } from "react";
import { Props } from "helpers/types";
import { usePressFeedback } from "hooks/useFeedback";
import { useLiquidGlass } from "components/functional/glass/use-liquid-glass";

import "./styles.css";

export interface FloatButtonProps extends Props<HTMLButtonElement> {
    variant?: "default" | "glass";
}

/**
 * Fixed, floating action button anchored to the bottom-right of the viewport.
 * `glass` gives it the liquid-glass surface (refracting the backdrop); `default`
 * is a solid accent pill. Reposition via style/className.
 */
export const FloatButton = forwardRef<HTMLButtonElement, FloatButtonProps>(
    ({ children, variant = "default", ...props }, ref) => {
        const innerRef = useRef<HTMLButtonElement | null>(null);

        const setRefs = useCallback(
            (node: HTMLButtonElement | null) => {
                innerRef.current = node;
                if (typeof ref === "function") ref(node);
                else if (ref) ref.current = node;
            },
            [ref],
        );

        useLiquidGlass(innerRef, {
            enabled: variant === "glass",
            scale: -80,
            frost: 0.1,
            displaceBlur: 0.75,
            aberration: [0, 4, 8],
        });
        const pressHandlers = usePressFeedback<HTMLButtonElement>(props);

        return (
            <button
                ref={setRefs}
                type="button"
                data-ms-floatbutton
                data-variant={variant}
                {...pressHandlers}
                {...props}
            >
                {children}
            </button>
        );
    },
);

FloatButton.displayName = "FloatButton";
