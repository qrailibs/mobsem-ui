import { forwardRef, useCallback } from "react";
import "./styles.css";
import { Props } from "helpers/types";
import { vibrate, triggerBounce } from "hooks/useFeedback";

export interface ToggleProps extends Props<HTMLInputElement> {
    checked?: boolean;
    defaultChecked?: boolean;
    onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export const Toggle = forwardRef<HTMLInputElement, ToggleProps>(
    ({ onChange, ...props }, ref) => {
        const handleChange = useCallback(
            (event: React.ChangeEvent<HTMLInputElement>) => {
                vibrate(10);
                const el = event.currentTarget;
                
                // Add bounce animation to the container
                const container = el.closest("[data-ms-toggle-container]");
                if (container) {
                    triggerBounce(container as HTMLElement, "data-bounce");
                }
                
                onChange?.(event);
            },
            [onChange]
        );

        return (
            <label data-ms-toggle-container>
                <input
                    ref={ref}
                    data-ms-toggle
                    type="checkbox"
                    onChange={handleChange}
                    {...props}
                />
                <span data-ms-toggle-track>
                    <span data-ms-toggle-thumb />
                </span>
            </label>
        );
    }
);

Toggle.displayName = "Toggle";

