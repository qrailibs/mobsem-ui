import { forwardRef } from "react";
import { PropsWithChildren } from "helpers/types";

import "./styles.css";

export interface SectionProps extends PropsWithChildren<HTMLElement> {
    variant?: "default" | "outline";
    label?: string;
}

export const Section = forwardRef<HTMLElement, SectionProps>(
    ({ children, variant = "default", label, ...props }, ref) => {
        return (
            <section
                ref={ref}
                data-ms-section
                data-variant={variant}
                data-labeled={!!label}
                {...props}
            >
                {label && <span data-ms-section-label>{label}</span>}
                {children}
            </section>
        );
    }
);

Section.displayName = "Section";
