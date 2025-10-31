import { forwardRef } from "react";
import { Props } from "helpers/types";

import "./styles.css";

export interface DividerProps extends Props<HTMLHRElement> {}

export const Divider = forwardRef<HTMLHRElement, DividerProps>(function (
    { children, ...props },
    ref
) {
    return <hr ref={ref} data-ms-divider {...props} />;
});
