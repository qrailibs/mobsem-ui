import { CSSProperties, forwardRef } from "react";
import { PropsWithChildren } from "helpers/types";

import "./styles.css";

export interface ScrollableProps extends PropsWithChildren<HTMLDivElement> {
    w?: number | string;
    h?: number | string;
    scroll: "x" | "y" | "x,y";
    gap?: number;
    overscroll?: "auto" | "contain" | "none";
    momentum?: boolean;
}

export const Scrollable = forwardRef<HTMLDivElement, ScrollableProps>(
    (
        {
            children,
            scroll,
            w,
            h,
            gap,
            overscroll = "contain",
            momentum = true,
            ...props
        },
        ref
    ) => {
        return (
            <div
                ref={ref}
                data-ms-scrollable
                data-scroll={scroll}
                style={
                    {
                        "--container-gap": `${gap ?? 4}px`,
                        width: w,
                        height: h,
                        minHeight: h,
                        maxHeight: h,
                        ...props.style,
                    } as CSSProperties
                }
                {...props}
            >
                <div
                    data-ms-scroll-viewport
                    data-scroll={scroll}
                    data-overscroll={overscroll}
                    data-momentum={momentum}
                    tabIndex={0}
                >
                    {children}
                </div>
            </div>
        );
    }
);

Scrollable.displayName = "Scrollable";
