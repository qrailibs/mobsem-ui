import { useMemo } from "react";

export function vibrate(pattern: number | number[] = 10) {
	if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
		navigator.vibrate(pattern);
	}
}

export function triggerBounce(el: HTMLElement, attrName: string = "data-bounce") {
	el.setAttribute(attrName, "true");
	const handleAnimationEnd = () => {
		el.removeAttribute(attrName);
		el.removeEventListener("animationend", handleAnimationEnd);
	};
	el.addEventListener("animationend", handleAnimationEnd);
}

type PointerHandlers<T extends HTMLElement> = {
	onPointerDown?: React.PointerEventHandler<T>;
	onPointerUp?: React.PointerEventHandler<T>;
	onPointerLeave?: React.PointerEventHandler<T>;
	onPointerCancel?: React.PointerEventHandler<T>;
};

export function usePressFeedback<T extends HTMLElement>(
	userHandlers?: PointerHandlers<T>,
	options?: { pressedAttr?: string; bounceAttr?: string; skipWhenFocused?: boolean }
) {
	const pressedAttr = options?.pressedAttr ?? "data-pressed";
	const bounceAttr = options?.bounceAttr ?? "data-bounce";
	const skipWhenFocused = options?.skipWhenFocused ?? false;

	return useMemo(() => {
		const onPointerDown: React.PointerEventHandler<T> = (event) => {
			const el = event.currentTarget as HTMLElement;
			// Only the tap that *focuses* an editable control should bounce;
			// presses while it's already focused (e.g. dragging to select text
			// in an input on iOS) must not. Focus lands after this handler, so
			// the focusing tap still sees a different activeElement here.
			if (!(skipWhenFocused && el === document.activeElement)) {
				el.removeAttribute(bounceAttr);
				el.setAttribute(pressedAttr, "true");
			}
			userHandlers?.onPointerDown?.(event);
		};

		const releaseWithBounce = (el: HTMLElement) => {
			el.removeAttribute(pressedAttr);
			triggerBounce(el, bounceAttr);
		};

		const onPointerUp: React.PointerEventHandler<T> = (event) => {
			const el = event.currentTarget as HTMLElement;
			// Bounce on release only if this sequence actually started a press.
			if (el.getAttribute(pressedAttr) === "true") releaseWithBounce(el);
			userHandlers?.onPointerUp?.(event);
		};

		const onPointerLeave: React.PointerEventHandler<T> = (event) => {
			const el = event.currentTarget as HTMLElement;
			if (el.getAttribute(pressedAttr) === "true") {
				releaseWithBounce(el);
			}
			userHandlers?.onPointerLeave?.(event);
		};

		const onPointerCancel: React.PointerEventHandler<T> = (event) => {
			const el = event.currentTarget as HTMLElement;
			if (el.getAttribute(pressedAttr) === "true") {
				releaseWithBounce(el);
			}
			userHandlers?.onPointerCancel?.(event);
		};

		return { onPointerDown, onPointerUp, onPointerLeave, onPointerCancel } as const;
	}, [userHandlers, pressedAttr, bounceAttr, skipWhenFocused]);
}

type ChangeHandler<T> = (event: React.ChangeEvent<T>) => void;

export function useBounceOnCheckChange(
	userHandler?: ChangeHandler<HTMLInputElement>,
	options?: { bounceAttr?: string; vibratePattern?: number | number[] }
) {
	const bounceAttr = options?.bounceAttr ?? "data-bounce";
	const vibratePattern = options?.vibratePattern ?? 10;

	return useMemo(() => {
		const onChange: React.ChangeEventHandler<HTMLInputElement> = (event) => {
			vibrate(vibratePattern);
			if (event.currentTarget.checked) {
				triggerBounce(event.currentTarget, bounceAttr);
			}
			userHandler?.(event);
		};
		return { onChange } as const;
	}, [userHandler, bounceAttr, vibratePattern]);
}


