import { forwardRef } from "react";
import { createPortal } from "react-dom";
import { PropsWithChildren } from "helpers/types";
import "./styles.css";

export interface PopoverProps extends PropsWithChildren<HTMLDivElement> {
    variant?: "blur-darken" | "darken" | "blur-muted" | "transparent";
    visible?: boolean;
}

export const Popover = forwardRef<HTMLDivElement, PopoverProps>(
    ({ children, visible, variant = "blur-darken", ...props }, ref) => {
        const portalRoot = document.getElementById("portal-root");

        if (!portalRoot) {
            console.warn("Portal root element not found");
            return null;
        }

        // Prevent scrolling of elements underneath the popover
        const handleTouchMove = (e: React.TouchEvent) => {
            e.preventDefault();
        };

        return createPortal(
            <div
                ref={ref}
                data-ms-popover
                data-variant={variant}
                role="presentation"
                aria-hidden={!visible}
                onTouchMove={handleTouchMove}
                {...props}
            >
                {children}
            </div>,
            portalRoot
        );
    }
);

Popover.displayName = "Popover";
