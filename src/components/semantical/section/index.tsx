import { forwardRef } from "react";
import { PropsWithChildren } from "helpers/types";

import "./styles.css";

export interface SectionProps extends PropsWithChildren<HTMLElement> {
    variant?: "default" | "outline";
}

export const Section = forwardRef<HTMLElement, SectionProps>(
    ({ children, variant = "default", ...props }, ref) => {
        return (
            <section
                ref={ref}
                data-ms-section
                data-variant={variant}
                {...props}
            >
                {children}
            </section>
        );
    }
);

Section.displayName = "Section";
