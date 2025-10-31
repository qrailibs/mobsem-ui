import { forwardRef } from "react";
import { Props } from "helpers/types";
import { usePressFeedback } from "hooks/useFeedback";

import "./styles.css";

export interface ButtonProps extends Props<HTMLButtonElement> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ children, ...props }, ref) => {
        const pressHandlers = usePressFeedback<HTMLButtonElement>(props);

        return (
            <button ref={ref} data-ms-button {...pressHandlers} {...props}>
                {children}
            </button>
        );
    }
);

Button.displayName = "Button";
