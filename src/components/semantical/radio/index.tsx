import { forwardRef, InputHTMLAttributes } from "react";
import "./styles.css";
import { useBounceOnCheckChange } from "hooks/useFeedback";

// Like the other inputs (TextInput/TextArea), Radio extends the input
// attributes so grouped/controlled usage (`name`, `value`, `checked`) type-checks.
export interface RadioProps
    extends Omit<InputHTMLAttributes<HTMLInputElement>, "data-ms-radio" | "type"> {
    [key: `data-${string}`]: unknown;
}

export const Radio = forwardRef<HTMLInputElement, RadioProps>(
    ({ onChange, ...props }, ref) => {
        const { onChange: handleChange } = useBounceOnCheckChange(onChange);

        return (
            <input
                ref={ref}
                data-ms-radio
                type="radio"
                onChange={handleChange}
                {...props}
            />
        );
    }
);

Radio.displayName = "Radio";
