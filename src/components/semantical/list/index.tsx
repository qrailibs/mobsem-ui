import { CSSProperties, forwardRef } from "react";
import { PropsWithChildren } from "helpers/types";
import "./styles.css";

export interface ListProps extends PropsWithChildren<HTMLUListElement> {
    px?: number;
    py?: number;
    gap?: number;
}

export const List = forwardRef<HTMLUListElement, ListProps>(
    ({ children, ...props }, ref) => {
        return (
            <ul
                ref={ref}
                data-ms-list
                role="list"
                style={
                    {
                        "--container-gap": `${props.gap ?? 4}px`,
                        ...props.style,
                    } as CSSProperties
                }
                {...props}
            >
                {children}
            </ul>
        );
    }
);

List.displayName = "List";
