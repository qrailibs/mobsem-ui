import { forwardRef } from "react";
import { PropsWithChildren } from "helpers/types";
import "./styles.css";

export interface ListItemProps extends PropsWithChildren<HTMLLIElement> {
    px?: number;
    py?: number;
    gap?: number;
}

export const ListItem = forwardRef<HTMLLIElement, ListItemProps>(function (
    { children, ...props },
    ref
) {
    return (
        <li ref={ref} data-ms-listitem role="listitem" {...props}>
            {children}
        </li>
    );
});
