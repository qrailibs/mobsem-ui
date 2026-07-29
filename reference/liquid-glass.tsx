"use client";

import { useEffect, useRef, type HTMLAttributes, type ReactNode } from "react";

import { createLiquidGlass, type LiquidGlassOptions } from "./liquid-glass";

/**
 * React wrapper around rizroze/liquid-glass — real optical refraction via a
 * Canvas-generated displacement map fed into an SVG feDisplacementMap filter
 * (three RGB passes for chromatic aberration). Chromium-only; elsewhere the
 * library falls back to a plain backdrop blur.
 *
 * The effect is attached to the rendered element on mount and torn down on
 * unmount; the library's own ResizeObserver keeps the map in sync with size.
 */
interface LiquidGlassProps extends HTMLAttributes<HTMLDivElement> {
    options?: LiquidGlassOptions;
    children?: ReactNode;
}

export function LiquidGlass({ options, children, ...rest }: LiquidGlassProps) {
    const ref = useRef<HTMLDivElement>(null);
    const optionsRef = useRef(options);
    optionsRef.current = options;

    useEffect(() => {
        if (!ref.current) return;
        const instance = createLiquidGlass(
            ref.current,
            optionsRef.current ?? {},
        );
        return () => instance.destroy();
        // Re-attach only when a tuning value actually changes, not on every render
        // (the options object is a fresh literal each time).
    }, [
        options?.scale,
        options?.borderRadius,
        options?.blur,
        options?.border,
        options?.lightness,
        options?.alpha,
        options?.frost,
        options?.saturation,
        options?.displaceBlur,
    ]);

    return (
        <div ref={ref} {...rest}>
            {children}
        </div>
    );
}
