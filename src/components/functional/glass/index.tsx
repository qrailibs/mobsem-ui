import { forwardRef } from "react";
import { PropsWithChildren } from "helpers/types";
import { useGlassFilter } from "./filter";

import "./styles.css";

export type GlassProps = PropsWithChildren<HTMLDivElement>;

/**
 * Liquid-glass surface powered by an SVG `backdrop-filter`.
 *
 * Drop it anywhere and give it size / position / border-radius through normal
 * CSS (className or style) — the glass refracts whatever is behind it and the
 * effect resolves to the element's own box automatically. Any content passed as
 * children renders on top of the glass.
 *
 * @example
 * <Glass style={{ width: 140, height: 120, borderRadius: 28 }}>Hello</Glass>
 */
export const Glass = forwardRef<HTMLDivElement, GlassProps>(
    ({ children, ...props }, ref) => {
        // Mounts the shared SVG filter once; effect id is referenced from CSS.
        useGlassFilter();

        return (
            <div ref={ref} data-ms-glass {...props}>
                {children}
            </div>
        );
    }
);

Glass.displayName = "Glass";
