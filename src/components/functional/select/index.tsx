import {
    CSSProperties,
    forwardRef,
    useCallback,
    useEffect,
    useId,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { createPortal } from "react-dom";
import { Props } from "helpers/types";
import { usePressFeedback, vibrate } from "hooks/useFeedback";

import "./styles.css";

export interface SelectItem {
    value: string;
    title: string;
    description?: string;
    icon?: React.ReactNode;
    disabled?: boolean;
}

export interface SelectGroup {
    label: string;
    items: SelectItem[];
}

/** A flat list of items, or grouped items — passed via the single `items` prop. */
export type SelectItems = SelectItem[] | SelectGroup[];

export interface SelectProps
    extends Omit<Props<HTMLButtonElement>, "onChange" | "defaultValue"> {
    items: SelectItems;
    value?: string;
    defaultValue?: string;
    placeholder?: string;
    disabled?: boolean;
    /** Allows filtering items by typing straight into the trigger. */
    search?: boolean;
    onChange?: (value: string) => void;
}

interface PanelCoords {
    left: number;
    width: number;
    top?: number;
    bottom?: number;
    maxHeight: number;
}

const PANEL_GAP = 6;
const VIEWPORT_MARGIN = 8;
const MAX_PANEL_HEIGHT = 320;
// Must stay in sync with the `ms-select-out` animation duration in styles.css.
const CLOSE_ANIMATION_MS = 140;

function isGrouped(items: SelectItems): items is SelectGroup[] {
    return items.length > 0 && "items" in items[0];
}

/** Normalise either shape into groups so rendering has a single code path. */
export function toGroups(items: SelectItems): SelectGroup[] {
    if (isGrouped(items)) return items;
    return [{ label: "", items: items as SelectItem[] }];
}

/** Case-insensitive match across an item's title and description. */
export function matchesQuery(item: SelectItem, query: string): boolean {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
        item.title.toLowerCase().includes(q) ||
        (item.description?.toLowerCase().includes(q) ?? false)
    );
}

const CheckIcon = () => (
    <svg
        data-ms-select-check
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M20 6 9 17l-5-5" />
    </svg>
);

const ChevronIcon = () => (
    <svg
        data-ms-select-chevron
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="m6 9 6 6 6-6" />
    </svg>
);

const ClearIcon = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M18 6 6 18" />
        <path d="m6 6 12 12" />
    </svg>
);

export const Select = forwardRef<HTMLButtonElement, SelectProps>(
    (
        {
            items,
            value,
            defaultValue,
            placeholder = "Select…",
            disabled,
            search = false,
            onChange,
            ...props
        },
        ref
    ) => {
        const isControlled = value !== undefined;
        const [internalValue, setInternalValue] = useState<string | undefined>(
            defaultValue
        );
        const currentValue = isControlled ? value : internalValue;

        const [open, setOpen] = useState(false);
        // Kept in the DOM through the close animation, then removed on its
        // `animationend` — this is what lets the panel animate out, not just in.
        const [mounted, setMounted] = useState(false);
        const [coords, setCoords] = useState<PanelCoords | null>(null);
        const [placement, setPlacement] = useState<"top" | "bottom">("bottom");
        const [highlight, setHighlight] = useState(-1);
        const [query, setQuery] = useState("");

        const triggerRef = useRef<HTMLButtonElement | null>(null);
        const panelRef = useRef<HTMLDivElement | null>(null);
        const searchRef = useRef<HTMLInputElement | null>(null);

        const setTriggerRef = useCallback(
            (node: HTMLButtonElement | null) => {
                triggerRef.current = node;
                if (typeof ref === "function") ref(node);
                else if (ref) ref.current = node;
            },
            [ref]
        );

        const groups = useMemo(() => toGroups(items), [items]);

        // Search narrows the rendered groups; the panel hides options instead
        // of removing the list, so the trigger keeps its position while typing.
        const filteredGroups = useMemo(() => {
            if (!search || !query.trim()) return groups;
            return groups
                .map((g) => ({
                    ...g,
                    items: g.items.filter((it) => matchesQuery(it, query)),
                }))
                .filter((g) => g.items.length > 0);
        }, [groups, query, search]);

        const hasMatches = useMemo(
            () => filteredGroups.some((g) => g.items.length > 0),
            [filteredGroups]
        );

        // Flattened, enabled-only list used for keyboard navigation.
        const navItems = useMemo(() => {
            const flat: SelectItem[] = [];
            for (const g of filteredGroups) {
                for (const it of g.items) {
                    if (!it.disabled) flat.push(it);
                }
            }
            return flat;
        }, [filteredGroups]);

        const selectedItem = useMemo(() => {
            for (const g of groups) {
                const found = g.items.find((it) => it.value === currentValue);
                if (found) return found;
            }
            return undefined;
        }, [groups, currentValue]);

        const updatePosition = useCallback(() => {
            const trigger = triggerRef.current;
            if (!trigger) return;

            const rect = trigger.getBoundingClientRect();
            const spaceBelow =
                window.innerHeight - rect.bottom - PANEL_GAP - VIEWPORT_MARGIN;
            const spaceAbove = rect.top - PANEL_GAP - VIEWPORT_MARGIN;

            const openBelow =
                spaceBelow >= Math.min(MAX_PANEL_HEIGHT, 220) ||
                spaceBelow >= spaceAbove;

            setPlacement(openBelow ? "bottom" : "top");
            setCoords({
                left: rect.left,
                width: rect.width,
                top: openBelow ? rect.bottom + PANEL_GAP : undefined,
                bottom: openBelow
                    ? undefined
                    : window.innerHeight - rect.top + PANEL_GAP,
                maxHeight: Math.min(
                    MAX_PANEL_HEIGHT,
                    openBelow ? spaceBelow : spaceAbove
                ),
            });
        }, []);

        const openPanel = useCallback(() => {
            if (disabled) return;
            updatePosition();
            setQuery("");
            const selectedNavIndex = navItems.findIndex(
                (it) => it.value === currentValue
            );
            setHighlight(selectedNavIndex);
            setMounted(true);
            setOpen(true);
            vibrate(10);
        }, [disabled, updatePosition, navItems, currentValue]);

        const closePanel = useCallback(() => {
            setOpen(false);
            setHighlight(-1);
            setQuery("");
            triggerRef.current?.focus();
        }, []);

        const commit = useCallback(
            (item: SelectItem) => {
                if (item.disabled) return;
                if (!isControlled) setInternalValue(item.value);
                onChange?.(item.value);
                vibrate(10);
                setOpen(false);
                setHighlight(-1);
                setQuery("");
                triggerRef.current?.focus();
            },
            [isControlled, onChange]
        );

        // Drop the panel from the DOM once the close animation has had time to
        // run. A timer (rather than `animationend`) is used deliberately:
        // iOS Safari fires `animationend` prematurely for portalled nodes,
        // which made the panel vanish instantly instead of animating out.
        useEffect(() => {
            if (open || !mounted) return;
            const t = setTimeout(() => setMounted(false), CLOSE_ANIMATION_MS);
            return () => clearTimeout(t);
        }, [open, mounted]);

        // Reposition on scroll/resize while the panel is open, and focus the
        // panel (or the in-trigger search input) so it receives keyboard input.
        useLayoutEffect(() => {
            if (!open) return;
            if (search) searchRef.current?.focus();
            else panelRef.current?.focus();
            const handle = () => updatePosition();
            window.addEventListener("resize", handle);
            window.addEventListener("scroll", handle, true);
            return () => {
                window.removeEventListener("resize", handle);
                window.removeEventListener("scroll", handle, true);
            };
        }, [open, search, updatePosition]);

        // Typing repositions the panel and clamps the highlight onto the first
        // matching option. Gated on an actual query change so it doesn't stomp
        // the "highlight the selected item" set by `openPanel`.
        const prevQueryRef = useRef("");
        useLayoutEffect(() => {
            if (!open) {
                prevQueryRef.current = "";
                return;
            }
            if (query === prevQueryRef.current) return;
            prevQueryRef.current = query;
            updatePosition();
            setHighlight(navItems.length > 0 ? 0 : -1);
        }, [open, query, navItems, updatePosition]);

        // Keep the highlighted option scrolled into view.
        useEffect(() => {
            if (!open || highlight < 0) return;
            const el = panelRef.current?.querySelector(
                `[data-ms-select-option][data-nav-index="${highlight}"]`
            );
            (el as HTMLElement | null)?.scrollIntoView({ block: "nearest" });
        }, [open, highlight]);

        const moveHighlight = useCallback(
            (delta: number) => {
                if (navItems.length === 0) return;
                setHighlight((prev) => {
                    const start = prev < 0 ? (delta > 0 ? -1 : 0) : prev;
                    const next =
                        (start + delta + navItems.length) % navItems.length;
                    return next;
                });
            },
            [navItems.length]
        );

        const handleTriggerKeyDown = (
            e: React.KeyboardEvent<HTMLButtonElement>
        ) => {
            // Key events from the inner search input bubble up here — the
            // input handles its own keys, so ignore anything not fired on
            // the trigger button itself.
            if (e.target !== e.currentTarget) return;
            if (
                e.key === "ArrowDown" ||
                e.key === "ArrowUp" ||
                e.key === "Enter" ||
                e.key === " "
            ) {
                e.preventDefault();
                openPanel();
                return;
            }
            // Searchable: typing a printable character opens the panel and
            // seeds the query with it (the input takes focus right after).
            if (
                search &&
                !open &&
                e.key.length === 1 &&
                !e.metaKey &&
                !e.ctrlKey &&
                !e.altKey
            ) {
                openPanel();
                setQuery(e.key);
            }
        };

        // Keyboard navigation lives on the search input itself while it is
        // focused (space stays a regular search character, Enter commits).
        const handleSearchKeyDown = (
            e: React.KeyboardEvent<HTMLInputElement>
        ) => {
            switch (e.key) {
                case "ArrowDown":
                    e.preventDefault();
                    moveHighlight(1);
                    break;
                case "ArrowUp":
                    e.preventDefault();
                    moveHighlight(-1);
                    break;
                case "Home":
                    e.preventDefault();
                    setHighlight(0);
                    break;
                case "End":
                    e.preventDefault();
                    setHighlight(navItems.length - 1);
                    break;
                case "Enter":
                    e.preventDefault();
                    if (highlight >= 0 && navItems[highlight]) {
                        commit(navItems[highlight]);
                    }
                    break;
                case "Escape":
                    e.preventDefault();
                    e.stopPropagation();
                    if (query) setQuery("");
                    else closePanel();
                    break;
                case "Tab":
                    closePanel();
                    break;
            }
        };

        const handlePanelKeyDown = (
            e: React.KeyboardEvent<HTMLDivElement>
        ) => {
            switch (e.key) {
                case "ArrowDown":
                    e.preventDefault();
                    moveHighlight(1);
                    break;
                case "ArrowUp":
                    e.preventDefault();
                    moveHighlight(-1);
                    break;
                case "Home":
                    e.preventDefault();
                    setHighlight(0);
                    break;
                case "End":
                    e.preventDefault();
                    setHighlight(navItems.length - 1);
                    break;
                case "Enter":
                case " ":
                    e.preventDefault();
                    if (highlight >= 0 && navItems[highlight]) {
                        commit(navItems[highlight]);
                    }
                    break;
                case "Escape":
                    e.preventDefault();
                    closePanel();
                    break;
                case "Tab":
                    closePanel();
                    break;
            }
        };

        const portalRoot =
            typeof document !== "undefined"
                ? document.getElementById("portal-root")
                : null;

        // Tapping the trigger (chevron, padding) must not blur the in-trigger
        // search input — that would drop the soft keyboard while the panel
        // stays open. Focus is re-applied after preventDefault, since the
        // default would move it to the button.
        const handleTriggerPointerDown: React.PointerEventHandler<HTMLButtonElement> =
            (e) => {
                if (
                    open &&
                    search &&
                    document.activeElement === searchRef.current &&
                    e.target !== searchRef.current
                ) {
                    e.preventDefault();
                    searchRef.current?.focus();
                }
                props.onPointerDown?.(e);
            };

        // Same rule as other inputs: no dip/bounce while the inner search
        // input is focused (`skipWhenFocused` covers the hook side, styles
        // exempt the trigger via `:has([data-ms-select-search]:focus)`).
        const pressHandlers = usePressFeedback<HTMLButtonElement>(
            { ...props, onPointerDown: handleTriggerPointerDown },
            { skipWhenFocused: search }
        );

        const listboxId = useId();

        // Running nav index across groups so keyboard + mouse stay in sync.
        let navCursor = -1;

        return (
            <>
                <button
                    ref={setTriggerRef}
                    type="button"
                    data-ms-select-trigger
                    data-open={open || undefined}
                    data-placeholder={!selectedItem || undefined}
                    disabled={disabled}
                    aria-haspopup="listbox"
                    aria-expanded={open}
                    onClick={() => (open ? closePanel() : openPanel())}
                    onKeyDown={handleTriggerKeyDown}
                    {...pressHandlers}
                    {...props}
                >
                    {selectedItem?.icon && (
                        <span data-ms-select-value-icon>
                            {selectedItem.icon}
                        </span>
                    )}
                    {search && open ? (
                        <input
                            ref={searchRef}
                            data-ms-select-search
                            type="text"
                            role="combobox"
                            aria-expanded={open}
                            aria-controls={listboxId}
                            aria-activedescendant={
                                highlight >= 0
                                    ? `${listboxId}-option-${highlight}`
                                    : undefined
                            }
                            autoComplete="off"
                            autoCorrect="off"
                            autoCapitalize="off"
                            spellCheck={false}
                            placeholder={
                                selectedItem ? selectedItem.title : placeholder
                            }
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={handleSearchKeyDown}
                            onClick={(e) => e.stopPropagation()}
                        />
                    ) : (
                        <span data-ms-select-value>
                            {selectedItem ? selectedItem.title : placeholder}
                        </span>
                    )}
                    {search && open && query ? (
                        <span
                            data-ms-select-clear
                            role="button"
                            aria-label="Clear search"
                            onClick={(e) => {
                                e.stopPropagation();
                                setQuery("");
                                searchRef.current?.focus();
                            }}
                        >
                            <ClearIcon />
                        </span>
                    ) : (
                        <ChevronIcon />
                    )}
                </button>

                {mounted &&
                    coords &&
                    portalRoot &&
                    createPortal(
                        <>
                            <div
                                data-ms-select-backdrop
                                data-state={open ? "open" : "closed"}
                                onClick={closePanel}
                                onTouchMove={(e) => e.preventDefault()}
                            />
                            <div
                                ref={panelRef}
                                id={listboxId}
                                data-ms-select-panel
                                data-placement={placement}
                                data-state={open ? "open" : "closed"}
                                role="listbox"
                                tabIndex={-1}
                                onKeyDown={handlePanelKeyDown}
                                style={
                                    {
                                        left: `${coords.left}px`,
                                        top:
                                            coords.top != null
                                                ? `${coords.top}px`
                                                : undefined,
                                        bottom:
                                            coords.bottom != null
                                                ? `${coords.bottom}px`
                                                : undefined,
                                        width: `${coords.width}px`,
                                        maxHeight: `${coords.maxHeight}px`,
                                    } as CSSProperties
                                }
                            >
                                {!hasMatches && (
                                    <span data-ms-select-empty>
                                        No matches found
                                    </span>
                                )}
                                {filteredGroups.map((group, gi) => (
                                    <div
                                        key={group.label || gi}
                                        data-ms-select-group
                                        role="group"
                                        aria-label={group.label || undefined}
                                    >
                                        {group.label && (
                                            <span data-ms-select-group-label>
                                                {group.label}
                                            </span>
                                        )}
                                        {group.items.map((item) => {
                                            if (!item.disabled) navCursor += 1;
                                            const navIndex = item.disabled
                                                ? -1
                                                : navCursor;
                                            const isSelected =
                                                item.value === currentValue;
                                            return (
                                                <button
                                                    key={item.value}
                                                    id={
                                                        navIndex >= 0
                                                            ? `${listboxId}-option-${navIndex}`
                                                            : undefined
                                                    }
                                                    type="button"
                                                    data-ms-select-option
                                                    data-nav-index={navIndex}
                                                    data-selected={
                                                        isSelected || undefined
                                                    }
                                                    data-highlighted={
                                                        navIndex === highlight ||
                                                        undefined
                                                    }
                                                    data-disabled={
                                                        item.disabled || undefined
                                                    }
                                                    role="option"
                                                    aria-selected={isSelected}
                                                    aria-disabled={item.disabled}
                                                    disabled={item.disabled}
                                                    onClick={() => commit(item)}
                                                    onMouseEnter={() =>
                                                        navIndex >= 0 &&
                                                        setHighlight(navIndex)
                                                    }
                                                >
                                                    {item.icon && (
                                                        <span data-ms-select-option-icon>
                                                            {item.icon}
                                                        </span>
                                                    )}
                                                    <hgroup data-ms-select-option-text>
                                                        <p>{item.title}</p>
                                                        {item.description && (
                                                            <small>
                                                                {
                                                                    item.description
                                                                }
                                                            </small>
                                                        )}
                                                    </hgroup>
                                                    {isSelected && <CheckIcon />}
                                                </button>
                                            );
                                        })}
                                    </div>
                                ))}
                            </div>
                        </>,
                        portalRoot
                    )}
            </>
        );
    }
);

Select.displayName = "Select";
