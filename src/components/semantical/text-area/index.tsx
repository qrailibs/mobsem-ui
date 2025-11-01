import { forwardRef, TextareaHTMLAttributes } from "react";

import "./styles.css";

export interface TextAreaProps
    extends Omit<
        TextareaHTMLAttributes<HTMLTextAreaElement>,
        "data-ms-textarea"
    > {
    [key: `data-${string}`]: unknown;
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
    ({ ...props }, ref) => {
        return <textarea ref={ref} data-ms-textarea {...props} />;
    }
);

TextArea.displayName = "TextArea";

