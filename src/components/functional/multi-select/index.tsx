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
import {
    SelectGroup,
    SelectItem,
    SelectItems,
    matchesQuery,
    toGroups,
} from "components/functional/select";

import "./styles.css";

export interface MultiSelectProps
    extends Omit<Props<HTMLButtonElement>, "onChange" | "defaultValue"> {
    items: SelectItems;
    value?: string[];
    defaultValue?: string[];
    placeholder?: string;
    disabled?: boolean;
    /** Allows filtering items by typing straight into the trigger. */
    search?: boolean;
    /** Minimum amount of selected values — selection can't drop below it. */
    min?: number;
    /** Maximum amount of selected values — further options lock once hit. */
    max?: number;
    onChange?: (value: string[]) => void;
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
// Must stay in sync with the `ms-select-out` animation duration in
// select/styles.css (the panel shares the select's attrs and keyframes).
const CLOSE_ANIMATION_MS = 140;
// Must stay in sync with the `ms-chip-in`/`ms-chip-out` durations in
// styles.css — the flags are purged once the animations have run.
const CHIP_IN_MS = 300;
const CHIP_OUT_MS = 160;

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

export const MultiSelect = forwardRef<HTMLButtonElement, MultiSelectProps>(
    (
        {
            items,
            value,
            defaultValue,
            placeholder = "Select…",
            disabled,
            search = false,
            min,
            max,
            onChange,
            ...props
        },
        ref
    ) => {
        const isControlled = value !== undefined;
        const [internalValue, setInternalValue] = useState<string[]>(
            defaultValue ?? []
        );
        const currentValues = useMemo(
            () => (isControlled ? value : internalValue),
            [isControlled, value, internalValue]
        );

        const [open, setOpen] = useState(false);
        // Kept in the DOM through the close animation, then removed after a
        // timeout — same approach as <Select> (see its note on iOS Safari).
        const [mounted, setMounted] = useState(false);
        const [coords, setCoords] = useState<PanelCoords | null>(null);
        const [placement, setPlacement] = useState<"top" | "bottom">("bottom");
        const [highlight, setHighlight] = useState(-1);
        const [query, setQuery] = useState("");
        // Chip enter/exit animation flags. `entering` holds values added since
        // mount; `leaving` keeps removed items rendered through their exit
        // animation (same mounted-through-animation trick as the panel).
        const [entering, setEntering] = useState<string[]>([]);
        const [leaving, setLeaving] = useState<SelectItem[]>([]);
        const chipTimers = useRef<number[]>([]);

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

        const selectedItems = useMemo(() => {
            const picked: SelectItem[] = [];
            for (const g of groups) {
                for (const it of g.items) {
                    if (currentValues.indexOf(it.value) !== -1) picked.push(it);
                }
            }
            return picked;
        }, [groups, currentValues]);

        // `max` reached: unselected options lock (selected ones stay
        // toggleable, so the user can always step back under the limit).
        const maxReached = max !== undefined && currentValues.length >= max;
        // `min` reached: selected options can't be deselected any further.
        const minReached =
            min !== undefined && currentValues.length <= min;

        const isSelected = useCallback(
            (item: SelectItem) => currentValues.indexOf(item.value) !== -1,
            [currentValues]
        );
        const isLocked = useCallback(
            (item: SelectItem) =>
                !item.disabled &&
                ((maxReached && !isSelected(item)) ||
                    (minReached && isSelected(item))),
            [maxReached, minReached, isSelected]
        );

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
            setHighlight(navItems.length > 0 ? 0 : -1);
            setMounted(true);
            setOpen(true);
            vibrate(10);
        }, [disabled, updatePosition, navItems]);

        const closePanel = useCallback(() => {
            setOpen(false);
            setHighlight(-1);
            setQuery("");
            triggerRef.current?.focus();
        }, []);

        const applyValues = useCallback(
            (next: string[]) => {
                if (!isControlled) setInternalValue(next);
                onChange?.(next);
            },
            [isControlled, onChange]
        );

        useEffect(
            () => () => chipTimers.current.forEach(clearTimeout),
            []
        );

        const markEntering = useCallback((item: SelectItem) => {
            // Re-adding mid-exit cancels the pending removal instead.
            setLeaving((prev) => prev.filter((it) => it.value !== item.value));
            setEntering((prev) =>
                prev.indexOf(item.value) !== -1 ? prev : [...prev, item.value]
            );
            const t = window.setTimeout(
                () =>
                    setEntering((prev) =>
                        prev.filter((v) => v !== item.value)
                    ),
                CHIP_IN_MS
            );
            chipTimers.current.push(t);
        }, []);

        const markLeaving = useCallback((item: SelectItem) => {
            setEntering((prev) => prev.filter((v) => v !== item.value));
            setLeaving((prev) => [
                ...prev.filter((it) => it.value !== item.value),
                item,
            ]);
            const t = window.setTimeout(
                () =>
                    setLeaving((prev) =>
                        prev.filter((it) => it.value !== item.value)
                    ),
                CHIP_OUT_MS
            );
            chipTimers.current.push(t);
        }, []);

        // Chips mid-exit-animation stay rendered (non-interactive) until the
        // timer above purges them; a re-added value drops out of the list.
        const leavingItems = useMemo(
            () => leaving.filter((it) => currentValues.indexOf(it.value) === -1),
            [leaving, currentValues]
        );

        // Unlike <Select>, toggling keeps the panel open for further picks.
        const toggle = useCallback(
            (item: SelectItem) => {
                if (item.disabled || isLocked(item)) return;
                if (isSelected(item)) {
                    markLeaving(item);
                    applyValues(currentValues.filter((v) => v !== item.value));
                } else {
                    markEntering(item);
                    applyValues([...currentValues, item.value]);
                }
                vibrate(10);
            },
            [
                isLocked,
                isSelected,
                currentValues,
                applyValues,
                markEntering,
                markLeaving,
            ]
        );

        const remove = useCallback(
            (item: SelectItem) => {
                if (disabled || minReached) return;
                if (!isSelected(item)) return;
                markLeaving(item);
                applyValues(currentValues.filter((v) => v !== item.value));
                vibrate(10);
            },
            [
                disabled,
                minReached,
                isSelected,
                currentValues,
                applyValues,
                markLeaving,
            ]
        );

        // Drop the panel from the DOM once the close animation has had time to
        // run (timer rather than `animationend`, same as <Select>).
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

        // Filtering, and the chips wrapping to new lines, change the trigger's
        // height — reposition the panel and keep the highlight valid: reset to
        // the first match on a query change, clamp otherwise (value toggles).
        const prevQueryRef = useRef("");
        useLayoutEffect(() => {
            if (!open) {
                prevQueryRef.current = "";
                return;
            }
            updatePosition();
            if (query !== prevQueryRef.current) {
                prevQueryRef.current = query;
                setHighlight(navItems.length > 0 ? 0 : -1);
            } else {
                setHighlight((prev) =>
                    navItems.length === 0
                        ? -1
                        : prev < 0
                          ? 0
                          : Math.min(prev, navItems.length - 1)
                );
            }
        }, [open, query, currentValues, navItems, updatePosition]);

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
                if (open) closePanel();
                else openPanel();
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
        // focused (space stays a regular search character, Enter toggles).
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
                        toggle(navItems[highlight]);
                    }
                    break;
                case "Backspace":
                    // Empty query + Backspace peels off the last chip.
                    if (!query && selectedItems.length > 0) {
                        e.preventDefault();
                        remove(selectedItems[selectedItems.length - 1]);
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

        const handlePanelKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
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
                        toggle(navItems[highlight]);
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

        // Tapping the trigger (chips, chevron, padding) must not blur the
        // in-trigger search input — that would drop the soft keyboard while
        // the panel stays open. Chip remove buttons do their own focusing.
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
        // input is focused (styles exempt the trigger via
        // `:has([data-ms-select-search]:focus)`).
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
                    data-ms-multiselect
                    data-open={open || undefined}
                    data-placeholder={selectedItems.length === 0 || undefined}
                    disabled={disabled}
                    aria-haspopup="listbox"
                    aria-expanded={open}
                    onClick={() => (open ? closePanel() : openPanel())}
                    onKeyDown={handleTriggerKeyDown}
                    {...pressHandlers}
                    {...props}
                >
                    <span data-ms-multiselect-values>
                        {selectedItems.map((item) => (
                            <span
                                key={item.value}
                                data-ms-multiselect-chip
                                data-entering={
                                    entering.indexOf(item.value) !== -1 ||
                                    undefined
                                }
                                data-locked={minReached || undefined}
                            >
                                {item.icon && (
                                    <span data-ms-select-option-icon>
                                        {item.icon}
                                    </span>
                                )}
                                <span data-ms-multiselect-chip-label>
                                    {item.title}
                                </span>
                                <span
                                    data-ms-multiselect-chip-remove
                                    role="button"
                                    aria-label={`Remove ${item.title}`}
                                    aria-disabled={minReached || undefined}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        remove(item);
                                        if (open && search) {
                                            searchRef.current?.focus();
                                        }
                                    }}
                                >
                                    <ClearIcon />
                                </span>
                            </span>
                        ))}
                        {leavingItems.map((item) => (
                            <span
                                key={`leaving-${item.value}`}
                                data-ms-multiselect-chip
                                data-leaving
                                aria-hidden="true"
                            >
                                {item.icon && (
                                    <span data-ms-select-option-icon>
                                        {item.icon}
                                    </span>
                                )}
                                <span data-ms-multiselect-chip-label>
                                    {item.title}
                                </span>
                            </span>
                        ))}
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
                                    selectedItems.length === 0
                                        ? placeholder
                                        : undefined
                                }
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                onKeyDown={handleSearchKeyDown}
                                onClick={(e) => e.stopPropagation()}
                            />
                        ) : (
                            selectedItems.length === 0 && (
                                <span data-ms-select-value>{placeholder}</span>
                            )
                        )}
                    </span>
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
                                aria-multiselectable="true"
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
                                            const selected = isSelected(item);
                                            const locked = isLocked(item);
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
                                                        selected || undefined
                                                    }
                                                    data-highlighted={
                                                        navIndex === highlight ||
                                                        undefined
                                                    }
                                                    data-disabled={
                                                        item.disabled ||
                                                        undefined
                                                    }
                                                    data-locked={
                                                        locked || undefined
                                                    }
                                                    role="option"
                                                    aria-selected={selected}
                                                    aria-disabled={
                                                        item.disabled || locked
                                                    }
                                                    disabled={item.disabled}
                                                    onClick={() => toggle(item)}
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
                                                    {selected && <CheckIcon />}
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

MultiSelect.displayName = "MultiSelect";
