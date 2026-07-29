import {
    createContext,
    useCallback,
    useContext,
    useRef,
    useState,
    ReactNode,
} from "react";
import { MediaViewer, MediaItem } from "./media-viewer";

interface RegisteredItem extends MediaItem {
    node: HTMLElement | null;
}

interface GalleryContextValue {
    register: (id: string, item: RegisteredItem) => void;
    unregister: (id: string) => void;
    openAt: (id: string) => void;
}

const GalleryContext = createContext<GalleryContextValue | null>(null);

/** Returns the enclosing gallery, or null when an Image stands alone. */
export const useGallery = () => useContext(GalleryContext);

export interface GalleryProviderProps {
    children: ReactNode;
}

/**
 * Groups descendant openable <Image>s so they share one viewer: opening any of
 * them shows the whole set with a thumbnail strip to switch between them.
 * <Carousel> wraps its children in this automatically.
 */
export function GalleryProvider({ children }: GalleryProviderProps) {
    // Registered images, keyed by a stable id; ordered by DOM position on open.
    const items = useRef(new Map<string, RegisteredItem>());
    const [view, setView] = useState<{ items: MediaItem[]; index: number } | null>(
        null
    );

    const register = useCallback((id: string, item: RegisteredItem) => {
        items.current.set(id, item);
    }, []);

    const unregister = useCallback((id: string) => {
        items.current.delete(id);
    }, []);

    const openAt = useCallback((id: string) => {
        const entries = Array.from(items.current.entries());
        // Present images in visual (document) order, not registration order.
        entries.sort(([, a], [, b]) => {
            if (!a.node || !b.node) return 0;
            const pos = a.node.compareDocumentPosition(b.node);
            return pos & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
        });
        const list = entries.map(([, it]) => ({
            src: it.src,
            srcSet: it.srcSet,
            sizes: it.sizes,
            alt: it.alt,
        }));
        const index = entries.findIndex(([itemId]) => itemId === id);
        setView({ items: list, index: Math.max(0, index) });
    }, []);

    return (
        <GalleryContext.Provider value={{ register, unregister, openAt }}>
            {children}
            {view && (
                <MediaViewer
                    items={view.items}
                    index={view.index}
                    onClose={() => setView(null)}
                />
            )}
        </GalleryContext.Provider>
    );
}
