import { forwardRef, useCallback, useState, useEffect, useRef } from "react";
import { Props } from "helpers/types";
import "./styles.css";

export interface SliderProps extends Props<HTMLInputElement> {
    min?: number;
    max?: number;
    step?: number;
    value?: number;
    defaultValue?: number;
    onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
    variant?: "default" | "thick";
}

export const Slider = forwardRef<HTMLInputElement, SliderProps>(
    (
        {
            min = 0,
            max = 100,
            step = 1,
            value,
            defaultValue,
            onChange,
            variant = "default",
            ...props
        },
        ref
    ) => {
        const [currentValue, setCurrentValue] = useState(
            value ?? defaultValue ?? min
        );
        const [isDragging, setIsDragging] = useState(false);
        const [tooltipPosition, setTooltipPosition] = useState(0);
        const containerRef = useRef<HTMLDivElement>(null);

        useEffect(() => {
            if (value !== undefined) {
                setCurrentValue(value);
            }
        }, [value]);

        const handleChange = useCallback(
            (event: React.ChangeEvent<HTMLInputElement>) => {
                const newValue = parseFloat(event.target.value);
                setCurrentValue(newValue);
                onChange?.(event);
            },
            [onChange]
        );

        const handleMouseDown = useCallback(() => {
            setIsDragging(true);
        }, []);

        const handleMouseUp = useCallback(() => {
            setIsDragging(false);
        }, []);

        const handleTouchStart = useCallback(() => {
            setIsDragging(true);
        }, []);

        const handleTouchEnd = useCallback(() => {
            setIsDragging(false);
        }, []);

        useEffect(() => {
            const handleGlobalMouseUp = () => setIsDragging(false);
            const handleGlobalTouchEnd = () => setIsDragging(false);

            window.addEventListener("mouseup", handleGlobalMouseUp);
            window.addEventListener("touchend", handleGlobalTouchEnd);

            return () => {
                window.removeEventListener("mouseup", handleGlobalMouseUp);
                window.removeEventListener("touchend", handleGlobalTouchEnd);
            };
        }, []);

        useEffect(() => {
            if (containerRef.current) {
                const thumbWidth = 40; // Thumb width in pixels
                const width = containerRef.current.offsetWidth;
                const percentage = (currentValue - min) / (max - min);
                // Account for thumb width: position ranges from thumbWidth/2 to width - thumbWidth/2
                const position =
                    thumbWidth / 2 + percentage * (width - thumbWidth);
                setTooltipPosition(position);
            }
        }, [currentValue, min, max, variant]);

        const percentage = ((currentValue - min) / (max - min)) * 100;

        return (
            <div ref={containerRef} data-ms-slider-container>
                {isDragging && (
                    <div
                        data-ms-slider-tooltip
                        data-variant={variant}
                        style={{
                            left: `${tooltipPosition}px`,
                        }}
                    >
                        {currentValue}
                    </div>
                )}
                <input
                    ref={ref}
                    data-ms-slider
                    data-variant={variant}
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={currentValue}
                    onChange={handleChange}
                    onMouseDown={handleMouseDown}
                    onMouseUp={handleMouseUp}
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                    style={
                        {
                            "--slider-value": `${percentage}%`,
                        } as React.CSSProperties
                    }
                    {...props}
                />
            </div>
        );
    }
);

Slider.displayName = "Slider";
