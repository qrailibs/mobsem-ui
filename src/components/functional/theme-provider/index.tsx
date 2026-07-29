import { CSSProperties, forwardRef, useLayoutEffect, useMemo } from "react";
import { PropsWithChildren } from "helpers/types";

import "./styles.css";

export type ThemeName = "default";
export type ThemeMode = "light" | "dark";
export type ThemeAccent = "cyan" | "blue";

type Ramp = Record<string, string>;

/** Accent ramps. `cyan` is the library default; `blue` matches iOS system blue. */
const ACCENTS: Record<ThemeAccent, Ramp> = {
    cyan: {
        "50": "#f0f9ff",
        "100": "#e0f2fe",
        "200": "#bae6fd",
        "300": "#7dd3fc",
        "400": "#36bffa",
        "500": "#0ea5e9",
        "600": "#0284c7",
        "700": "#0369a1",
        "800": "#075985",
        "900": "#0c4a6e",
    },
    blue: {
        "50": "#e6f0ff",
        "100": "#cce1ff",
        "200": "#99c3ff",
        "300": "#66a5ff",
        "400": "#3387ff",
        "500": "#007aff",
        "600": "#0062cc",
        "700": "#004999",
        "800": "#003166",
        "900": "#001833",
    },
};

/** Neutral ramp. `dark` is the light ramp flipped end-to-end (0↔900, 100↔800…). */
const NEUTRALS: Record<ThemeMode, Ramp> = {
    light: {
        "0": "#ffffff",
        "100": "#f5f5f5",
        "200": "#e5e5e5",
        "300": "#d4d4d4",
        "400": "#a3a3a3",
        "500": "#737373",
        "600": "#525252",
        "700": "#404040",
        "800": "#262626",
        "900": "#171717",
    },
    dark: {
        "0": "#171717",
        "100": "#262626",
        "200": "#404040",
        "300": "#525252",
        "400": "#737373",
        "500": "#a3a3a3",
        "600": "#d4d4d4",
        "700": "#e5e5e5",
        "800": "#f5f5f5",
        "900": "#ffffff",
    },
};

function buildVars(mode: ThemeMode, accent: ThemeAccent): Record<string, string> {
    const vars: Record<string, string> = {};
    const neutral = NEUTRALS[mode];
    const acc = ACCENTS[accent];
    for (const step of Object.keys(neutral)) {
        vars[`--color-neutral-${step}`] = neutral[step];
    }
    for (const step of Object.keys(acc)) {
        vars[`--color-accent-${step}`] = acc[step];
    }
    return vars;
}

export interface ThemeProviderProps extends PropsWithChildren<HTMLDivElement> {
    theme?: ThemeName;
    mode?: ThemeMode;
    accent?: ThemeAccent;
    /**
     * Also write the variables onto :root so portalled UI (sheets, selects,
     * popovers) inherits the theme. Enabled by default.
     */
    global?: boolean;
}

export const ThemeProvider = forwardRef<HTMLDivElement, ThemeProviderProps>(
    (
        {
            children,
            theme = "default",
            mode = "light",
            accent = "cyan",
            global = true,
            style,
            ...props
        },
        ref
    ) => {
        const vars = useMemo(() => buildVars(mode, accent), [mode, accent]);

        // Mirror the variables onto the document root so portalled content
        // (rendered outside this subtree) is themed as well.
        useLayoutEffect(() => {
            if (!global) return;
            const root = document.documentElement;
            const keys = Object.keys(vars);
            for (const key of keys) root.style.setProperty(key, vars[key]);
            root.setAttribute("data-ms-mode", mode);
            return () => {
                for (const key of keys) root.style.removeProperty(key);
                root.removeAttribute("data-ms-mode");
            };
        }, [vars, mode, global]);

        return (
            <div
                ref={ref}
                data-ms-theme
                data-mode={mode}
                data-accent={accent}
                data-theme={theme}
                style={{ ...(vars as CSSProperties), ...style }}
                {...props}
            >
                {children}
            </div>
        );
    }
);

ThemeProvider.displayName = "ThemeProvider";
