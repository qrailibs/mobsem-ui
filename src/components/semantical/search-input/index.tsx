import { forwardRef, InputHTMLAttributes } from "react";
import { usePressFeedback } from "hooks/useFeedback";

import "./styles.css";

export interface SearchInputProps
    extends Omit<InputHTMLAttributes<HTMLInputElement>, "data-ms-searchinput"> {
    [key: `data-${string}`]: unknown;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
    ({ ...props }, ref) => {
        const pressHandlers = usePressFeedback<HTMLInputElement>(props, {
            skipWhenFocused: true,
        });

        return (
            <div data-ms-searchinput-wrapper>
                <svg
                    data-ms-searchinput-icon
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.35-4.35" />
                </svg>
                <input
                    ref={ref}
                    data-ms-searchinput
                    type="search"
                    {...pressHandlers}
                    {...props}
                />
            </div>
        );
    }
);

SearchInput.displayName = "SearchInput";
