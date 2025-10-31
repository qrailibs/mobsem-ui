import { forwardRef } from "react";
import "./styles.css";
import { Props } from "helpers/types";
import { useBounceOnCheckChange } from "hooks/useFeedback";

export interface CheckboxProps extends Props<HTMLInputElement> {}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
    ({ onChange, ...props }, ref) => {
        const { onChange: handleChange } = useBounceOnCheckChange(onChange);

        return (
            <input
                ref={ref}
                data-ms-checkbox
                type="checkbox"
                onChange={handleChange}
                {...props}
            />
        );
    }
);

Checkbox.displayName = "Checkbox";
