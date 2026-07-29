import { forwardRef } from "react";
import { PropsWithChildren } from "helpers/types";

import "./styles.css";

export interface LabelProps extends PropsWithChildren<HTMLSpanElement> {
    variant?:
        | "default"
        | "outline"
        | "accent"
        | "danger"
        | "warning"
        | "success";
}

export const Label = forwardRef<HTMLSpanElement, LabelProps>(
    ({ children, variant = "default", ...props }, ref) => {
        return (
            <span ref={ref} data-ms-label data-variant={variant} {...props}>
                {children}
            </span>
        );
    },
);

Label.displayName = "Label";
