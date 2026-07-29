import { forwardRef, InputHTMLAttributes } from "react";
import { usePressFeedback } from "hooks/useFeedback";

import "./styles.css";

export interface TextInputProps
    extends Omit<InputHTMLAttributes<HTMLInputElement>, "data-ms-textinput"> {
    [key: `data-${string}`]: unknown;
}

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
    ({ type = "text", ...props }, ref) => {
        const pressHandlers = usePressFeedback<HTMLInputElement>(props, {
            skipWhenFocused: true,
        });

        return (
            <input
                ref={ref}
                data-ms-textinput
                type={type}
                {...pressHandlers}
                {...props}
            />
        );
    }
);

TextInput.displayName = "TextInput";

