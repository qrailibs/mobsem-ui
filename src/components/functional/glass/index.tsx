import { forwardRef, useCallback, useRef } from "react";
import { PropsWithChildren } from "helpers/types";
import { useLiquidGlass } from "./use-liquid-glass";
import { LiquidGlassOptions } from "./liquid-glass";

import "./styles.css";

export interface GlassProps extends PropsWithChildren<HTMLDivElement> {
    /** Tuning for the refraction (scale, blur, chromatic aberration, …). */
    glass?: LiquidGlassOptions;
}

/**
 * Liquid-glass surface with real optical refraction — a Canvas-generated
 * displacement map (three RGB passes for chromatic aberration) fed into an SVG
 * `feDisplacementMap`, applied as a `backdrop-filter`. Chromium gets the full
 * effect; other engines fall back to a plain backdrop blur.
 *
 * Give it size / position / border-radius through normal CSS — the lens sizes
 * itself to the element and matches its corner radius automatically.
 *
 * @example
 * <Glass style={{ width: 140, height: 120, borderRadius: 28 }}>Hello</Glass>
 */
export const Glass = forwardRef<HTMLDivElement, GlassProps>(
    ({ children, glass, ...props }, ref) => {
        const innerRef = useRef<HTMLDivElement | null>(null);

        const setRefs = useCallback(
            (node: HTMLDivElement | null) => {
                innerRef.current = node;
                if (typeof ref === "function") ref(node);
                else if (ref) ref.current = node;
            },
            [ref]
        );

        useLiquidGlass(innerRef, {
            fallbackFilter: "blur(10px) saturate(1.6)",
            ...glass,
        });

        return (
            <div ref={setRefs} data-ms-glass {...props}>
                {children}
            </div>
        );
    }
);

Glass.displayName = "Glass";
