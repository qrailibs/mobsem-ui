import { forwardRef, InputHTMLAttributes } from "react";

import "./styles.css";

export interface TextInputProps
    extends Omit<InputHTMLAttributes<HTMLInputElement>, "data-ms-textinput"> {
    [key: `data-${string}`]: unknown;
}

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
    ({ type = "text", ...props }, ref) => {
        return <input ref={ref} data-ms-textinput type={type} {...props} />;
    }
);

TextInput.displayName = "TextInput";

