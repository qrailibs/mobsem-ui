import { forwardRef, useCallback, useEffect, useId, useRef, useState } from "react";
import { Props } from "helpers/types";
import { usePressFeedback, vibrate } from "hooks/useFeedback";
import { MediaViewer } from "./media-viewer";
import { useGallery } from "./gallery";

import "./styles.css";

export { GalleryProvider } from "./gallery";
export type { GalleryProviderProps } from "./gallery";

export interface ImageProps extends Props<HTMLImageElement> {
    src: string;
    alt?: string;
    /** Defer loading until near the viewport, showing a spinner until ready. */
    lazy?: boolean;
    /** Bounce on press; tap opens a full-screen, pinch-to-zoom viewer. */
    openable?: boolean;
    /** srcset/sizes are forwarded to the underlying <img>. */
    srcSet?: string;
    sizes?: string;
}

export const Image = forwardRef<HTMLImageElement, ImageProps>(
    (
        {
            src,
            alt = "",
            lazy,
            openable,
            srcSet,
            sizes,
            onLoad,
            onError,
            onClick,
            style,
            ...props
        },
        ref
    ) => {
        // Lazy images start "unloaded" (spinner visible); eager ones are ready.
        const [loaded, setLoaded] = useState(!lazy);
        const [soloOpen, setSoloOpen] = useState(false);

        const id = useId();
        const gallery = useGallery();

        // Keep our own handle on the <img> so the gallery can order by DOM
        // position, while still honouring a forwarded ref.
        const innerRef = useRef<HTMLImageElement | null>(null);
        const setRef = useCallback(
            (node: HTMLImageElement | null) => {
                innerRef.current = node;
                if (typeof ref === "function") ref(node);
                else if (ref) ref.current = node;
            },
            [ref]
        );

        const pressHandlers = usePressFeedback<HTMLImageElement>(props);

        // Register with an enclosing gallery so siblings share one viewer.
        useEffect(() => {
            if (!openable || !gallery) return;
            gallery.register(id, {
                src,
                srcSet,
                sizes,
                alt,
                node: innerRef.current,
            });
            return () => gallery.unregister(id);
        }, [openable, gallery, id, src, srcSet, sizes, alt]);

        const handleLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
            setLoaded(true);
            onLoad?.(e);
        };

        // Still hide the spinner on error — a broken image shouldn't spin forever.
        const handleError = (e: React.SyntheticEvent<HTMLImageElement>) => {
            setLoaded(true);
            onError?.(e);
        };

        const handleClick = (e: React.MouseEvent<HTMLImageElement>) => {
            onClick?.(e);
            if (!openable) return;
            vibrate(10);
            if (gallery) gallery.openAt(id);
            else setSoloOpen(true);
        };

        return (
            <span data-ms-image-wrap data-loading={(lazy && !loaded) || undefined}>
                <img
                    ref={setRef}
                    data-ms-image
                    data-openable={openable || undefined}
                    data-loaded={loaded || undefined}
                    src={src}
                    srcSet={srcSet}
                    sizes={sizes}
                    alt={alt}
                    loading={lazy ? "lazy" : undefined}
                    decoding="async"
                    style={style}
                    {...(openable ? pressHandlers : {})}
                    {...props}
                    onLoad={handleLoad}
                    onError={handleError}
                    onClick={handleClick}
                />
                {lazy && !loaded && (
                    <span data-ms-image-spinner aria-hidden="true" />
                )}
                {/* Solo viewer only when this image isn't part of a gallery. */}
                {soloOpen && !gallery && (
                    <MediaViewer
                        items={[{ src, srcSet, sizes, alt }]}
                        index={0}
                        onClose={() => setSoloOpen(false)}
                    />
                )}
            </span>
        );
    }
);

Image.displayName = "Image";
