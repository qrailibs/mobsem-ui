import { forwardRef } from "react";
import { PropsWithChildren } from "helpers/types";
import "./styles.css";

export interface PopoverProps extends PropsWithChildren<HTMLDivElement> {
    visible?: boolean;
}

export const Popover = forwardRef<HTMLDivElement, PopoverProps>(function (
    { children, visible, ...props },
    ref
) {
    return (
        <div
            ref={ref}
            data-ms-popover
            role="presentation"
            aria-hidden={!visible}
            {...props}
        >
            {children}
        </div>
    );
});
