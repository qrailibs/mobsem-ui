import { forwardRef } from "react";
import { Props } from "helpers/types";

import "./styles.css";

export interface CaptionProps extends Props<HTMLHRElement> {
    level?: 1 | 2 | 3 | 4 | 5 | 6;
}

export const Caption = forwardRef<HTMLHRElement, CaptionProps>(function (
    { children, level = 1, ...props },
    ref
) {
    const Heading = `h${level}` as keyof JSX.IntrinsicElements;
    return <h1></h1>;
});
