import { CSSProperties, forwardRef } from "react";
import { PropsWithChildren } from "helpers/types";
import "./styles.css";

export interface ListProps extends PropsWithChildren<HTMLUListElement> {
    px?: number;
    py?: number;
    gap?: number;
}

export const List = forwardRef<HTMLUListElement, ListProps>(function (
    { children, ...props },
    ref
) {
    return (
        <ul
            ref={ref}
            data-ms-list
            role="list"
            style={
                {
                    "--item-padding-x": `${props.px ?? 8}px`,
                    "--item-padding-y": `${props.py ?? 12}px`,
                    "--item-gap": `${props.gap ?? 4}px`,
                    ...props.style,
                } as CSSProperties
            }
            {...props}
        >
            {children}
        </ul>
    );
});
