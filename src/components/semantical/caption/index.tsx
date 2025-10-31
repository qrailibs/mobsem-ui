import React, { forwardRef } from "react";

type Level = 1 | 2 | 3 | 4 | 5 | 6;
type HeadingTag = `h${Level}`;

export type CaptionProps = React.ComponentPropsWithoutRef<HeadingTag> & {
    level?: Level;
};

export const Caption = forwardRef<HTMLHeadingElement, CaptionProps>(
    ({ level = 1, children, ...props }, ref) => {
        const TAG_MAP: Record<Level, HeadingTag> = {
            1: "h1",
            2: "h2",
            3: "h3",
            4: "h4",
            5: "h5",
            6: "h6",
        };

        const Tag = TAG_MAP[level]; // typed as HeadingTag ("h1" | ... | "h6")
        return (
            // Tag is a narrow union of only heading tags — TS will infer correct props/ref mapping
            <Tag
                ref={ref}
                data-ms-caption
                {...(props as React.ComponentPropsWithoutRef<HeadingTag>)}
            >
                {children}
            </Tag>
        );
    }
);

Caption.displayName = "Caption";
