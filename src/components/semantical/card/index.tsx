import { forwardRef } from "react";
import { PropsWithChildren } from "helpers/types";
import { usePressFeedback } from "hooks/useFeedback";

import "./styles.css";

export interface CardProps extends PropsWithChildren<HTMLDivElement> {
    variant?:
        | "default"
        | "outline"
        | "contrast"
        | "accent"
        | "accent-outline"
        | "ghost";
    /** Enable hover feedback and a bouncy press, tuned per variant. */
    interactive?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
    ({ children, variant = "default", interactive, ...props }, ref) => {
        const pressHandlers = usePressFeedback<HTMLDivElement>(props);

        return (
            <div
                ref={ref}
                data-ms-card
                data-variant={variant}
                data-interactive={interactive || undefined}
                {...(interactive ? pressHandlers : {})}
                {...props}
            >
                {children}
            </div>
        );
    }
);

Card.displayName = "Card";
