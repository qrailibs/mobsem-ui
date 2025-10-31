import {
    HTMLAttributes,
    PropsWithChildren as ReactPropsWithChildren,
    Ref,
} from "react";

export type Props<T extends HTMLElement> = Partial<HTMLAttributes<T>> & {
    [key: `data-${string}`]: unknown;
};

export type PropsWithChildren<T extends HTMLElement> = ReactPropsWithChildren<
    Props<T>
>;

export type PropsWithRef<T extends HTMLElement> = Props<T> & {
    ref?: Ref<T>;
};
