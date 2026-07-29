import { CSSProperties, forwardRef } from "react";
import { PropsWithChildren } from "helpers/types";

import "./styles.css";

/**
 * SwiftUI-flavoured layout primitives. Compose pages the way you would lay out
 * an iOS view:
 *
 *   <VStack spacing={12} align="start">
 *       <HStack spacing={8}>
 *           <Avatar />
 *           <Title />
 *           <Spacer />
 *           <Badge />
 *       </HStack>
 *   </VStack>
 */

type Align = "start" | "center" | "end" | "stretch" | "baseline";
type Justify = "start" | "center" | "end" | "between" | "around" | "evenly";

export interface StackProps extends PropsWithChildren<HTMLDivElement> {
    /** Gap between children, in px. */
    spacing?: number;
    /** Cross-axis alignment (SwiftUI `alignment`). */
    align?: Align;
    /** Main-axis distribution. */
    justify?: Justify;
    /** Uniform padding, in px. */
    padding?: number;
    /** Let the stack expand to fill its parent's main axis. */
    grow?: boolean;
    /** Allow children to wrap onto multiple lines. */
    wrap?: boolean;
}

const stackStyle = (
    { spacing, padding, grow }: StackProps,
    style?: CSSProperties
): CSSProperties =>
    ({
        "--stack-spacing": spacing != null ? `${spacing}px` : undefined,
        "--stack-padding": padding != null ? `${padding}px` : undefined,
        flex: grow ? 1 : undefined,
        ...style,
    }) as CSSProperties;

export const VStack = forwardRef<HTMLDivElement, StackProps>(
    (
        {
            children,
            spacing,
            align = "stretch",
            justify = "start",
            padding,
            grow,
            wrap,
            style,
            ...props
        },
        ref
    ) => {
        return (
            <div
                ref={ref}
                data-ms-vstack
                data-align={align}
                data-justify={justify}
                data-wrap={wrap || undefined}
                style={stackStyle({ spacing, padding, grow }, style)}
                {...props}
            >
                {children}
            </div>
        );
    }
);

VStack.displayName = "VStack";

export const HStack = forwardRef<HTMLDivElement, StackProps>(
    (
        {
            children,
            spacing,
            align = "center",
            justify = "start",
            padding,
            grow,
            wrap,
            style,
            ...props
        },
        ref
    ) => {
        return (
            <div
                ref={ref}
                data-ms-hstack
                data-align={align}
                data-justify={justify}
                data-wrap={wrap || undefined}
                style={stackStyle({ spacing, padding, grow }, style)}
                {...props}
            >
                {children}
            </div>
        );
    }
);

HStack.displayName = "HStack";

export interface ZStackProps extends PropsWithChildren<HTMLDivElement> {
    /** Where overlapping children align within the box. */
    align?: Align;
    justify?: Justify;
    padding?: number;
    grow?: boolean;
}

export const ZStack = forwardRef<HTMLDivElement, ZStackProps>(
    (
        {
            children,
            align = "center",
            justify = "center",
            padding,
            grow,
            style,
            ...props
        },
        ref
    ) => {
        return (
            <div
                ref={ref}
                data-ms-zstack
                data-align={align}
                data-justify={justify}
                style={stackStyle({ padding, grow }, style)}
                {...props}
            >
                {children}
            </div>
        );
    }
);

ZStack.displayName = "ZStack";

export interface SpacerProps extends PropsWithChildren<HTMLDivElement> {
    /** Optional fixed minimum length, in px (SwiftUI `Spacer(minLength:)`). */
    minLength?: number;
}

export const Spacer = forwardRef<HTMLDivElement, SpacerProps>(
    ({ minLength, style, ...props }, ref) => {
        return (
            <div
                ref={ref}
                data-ms-spacer
                aria-hidden="true"
                style={
                    {
                        "--spacer-min":
                            minLength != null ? `${minLength}px` : undefined,
                        ...style,
                    } as CSSProperties
                }
                {...props}
            />
        );
    }
);

Spacer.displayName = "Spacer";
