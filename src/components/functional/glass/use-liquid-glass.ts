import { RefObject, useEffect } from "react";
import { createLiquidGlass, LiquidGlassOptions } from "./liquid-glass";

export type UseLiquidGlassOptions = LiquidGlassOptions & {
    /** Attach the effect only when true (e.g. a `glass` variant). Default true. */
    enabled?: boolean;
};

/**
 * Attaches the Canvas-based liquid-glass refraction to a ref'd element for its
 * lifetime. Chromium gets real per-element displacement; other engines fall
 * back to a plain backdrop blur (handled by the engine). Width/height track the
 * element via the engine's own ResizeObserver; the corner radius defaults to
 * the element's computed `border-radius` so the lens matches its shape.
 */
export function useLiquidGlass<T extends HTMLElement>(
    ref: RefObject<T | null>,
    options: UseLiquidGlassOptions = {},
) {
    const {
        enabled = true,
        scale,
        borderRadius,
        blur,
        border,
        lightness,
        alpha,
        frost,
        saturation,
        displaceBlur,
        aberration,
        fallbackFilter,
    } = options;

    useEffect(() => {
        const el = ref.current;
        if (!el || !enabled) return;

        // Match the element's own rounding unless a radius was supplied.
        const computed =
            borderRadius ??
            (parseFloat(getComputedStyle(el).borderTopLeftRadius) || undefined);

        const instance = createLiquidGlass(el, {
            scale,
            blur,
            border,
            lightness,
            alpha,
            frost,
            saturation,
            displaceBlur,
            aberration,
            fallbackFilter,
            borderRadius: computed,
        });

        return () => instance.destroy();
    }, [
        ref,
        enabled,
        scale,
        borderRadius,
        blur,
        border,
        lightness,
        alpha,
        frost,
        saturation,
        displaceBlur,
    ]);
}
