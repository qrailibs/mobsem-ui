import { forwardRef, useState, useCallback, useRef, useEffect } from "react";
import "./styles.css";
import { Props } from "helpers/types";
import { vibrate } from "hooks/useFeedback";

export interface SegmentedTabsOption {
    value: string;
    label: string;
    icon?: React.ReactNode;
}

export interface SegmentedTabsProps
    extends Omit<Props<HTMLDivElement>, "onChange"> {
    options: SegmentedTabsOption[];
    value?: string;
    defaultValue?: string;
    onChange?: (value: string) => void;
}

export const SegmentedTabs = forwardRef<HTMLDivElement, SegmentedTabsProps>(
    ({ options, value, defaultValue, onChange, ...props }, ref) => {
        const isControlled = value !== undefined;
        const [selectedValue, setSelectedValue] = useState<string>(
            value ?? defaultValue ?? options[0]?.value ?? ""
        );
        const containerRef = useRef<HTMLDivElement>(null);
        const [indicatorStyle, setIndicatorStyle] = useState<{
            left: number;
            width: number;
        }>({ left: 0, width: 0 });

        const currentValue = isControlled ? value : selectedValue;

        const updateIndicatorPosition = useCallback(() => {
            const container = containerRef.current;
            if (!container) return;

            const selectedIndex = options.findIndex(
                (opt) => opt.value === currentValue
            );
            if (selectedIndex === -1) return;

            const button = container.querySelector(
                `[data-ms-segmented-tab-button][data-index="${selectedIndex}"]`
            ) as HTMLElement;

            if (button) {
                setIndicatorStyle({
                    left: button.offsetLeft,
                    width: button.offsetWidth,
                });
            }
        }, [options, currentValue]);

        useEffect(() => {
            updateIndicatorPosition();
        }, [updateIndicatorPosition]);

        useEffect(() => {
            const handleResize = () => updateIndicatorPosition();
            window.addEventListener("resize", handleResize);
            return () => window.removeEventListener("resize", handleResize);
        }, [updateIndicatorPosition]);

        const handleTabClick = useCallback(
            (optionValue: string) => {
                vibrate(10);

                if (!isControlled) {
                    setSelectedValue(optionValue);
                }

                onChange?.(optionValue);
            },
            [isControlled, onChange]
        );

        return (
            <div ref={ref} data-ms-segmented-tabs-container {...props}>
                <div ref={containerRef} data-ms-segmented-tabs role="tablist">
                    <div
                        data-ms-segmented-tabs-indicator
                        style={{
                            transform: `translateX(${indicatorStyle.left}px)`,
                            width: `${indicatorStyle.width}px`,
                        }}
                    />
                    {options.map((option, index) => {
                        const isSelected = option.value === currentValue;
                        return (
                            <button
                                key={option.value}
                                data-ms-segmented-tab-button
                                data-index={index}
                                data-selected={isSelected || undefined}
                                role="tab"
                                aria-selected={isSelected}
                                onClick={() => handleTabClick(option.value)}
                                type="button"
                            >
                                {option.icon}
                                {option.label}
                            </button>
                        );
                    })}
                </div>
            </div>
        );
    }
);

SegmentedTabs.displayName = "SegmentedTabs";
