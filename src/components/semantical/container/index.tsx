import { CSSProperties, forwardRef } from "react";
import { PropsWithChildren } from "helpers/types";

import "./styles.css";

export interface ContainerProps extends PropsWithChildren<HTMLDivElement> {
    /** Max content width in px (or any CSS length). Defaults to a phone width. */
    maxWidth?: number | string;
}

export const Container = forwardRef<HTMLDivElement, ContainerProps>(
    ({ children, maxWidth, ...props }, ref) => {
        return (
            <div
                ref={ref}
                data-ms-container
                style={
                    {
                        "--container-max":
                            maxWidth != null
                                ? typeof maxWidth === "number"
                                    ? `${maxWidth}px`
                                    : maxWidth
                                : undefined,
                        ...props.style,
                    } as CSSProperties
                }
                {...props}
            >
                {children}
            </div>
        );
    }
);

Container.displayName = "Container";
