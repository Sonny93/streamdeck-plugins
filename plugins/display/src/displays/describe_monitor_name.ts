import type { DisplayInfo } from './display_info';
import type { ScreenBounds } from './screen_bounds';

const PRIMARY_PLACE = 'main';

function describePlace(bounds: ScreenBounds, primary: ScreenBounds): string {
	const horizontal =
		bounds.left + bounds.width <= primary.left
			? 'left'
			: bounds.left >= primary.left + primary.width
				? 'right'
				: '';
	const vertical =
		bounds.top + bounds.height <= primary.top
			? 'top'
			: bounds.top >= primary.top + primary.height
				? 'bottom'
				: '';
	return [vertical, horizontal].filter((part) => part !== '').join(' ');
}

/**
 * Names a monitor by its model and its place next to the primary one, such as "PL2530H (top)",
 * so two monitors of the same model can be told apart; the GDI name is added when that is not enough.
 */
export function describeMonitorName(
	display: DisplayInfo,
	displays: readonly DisplayInfo[]
): string {
	const primary = displays.find((candidate) => candidate.isPrimary);
	const placeOf = (candidate: DisplayInfo): string =>
		candidate.isPrimary || primary === undefined
			? PRIMARY_PLACE
			: describePlace(candidate.bounds, primary.bounds);
	const place = placeOf(display);
	const isAmbiguous =
		place === '' ||
		displays.some(
			(other) =>
				other.id !== display.id &&
				other.model === display.model &&
				placeOf(other) === place
		);
	const details = isAmbiguous
		? [place, display.gdiName.replace(/^\\\\\.\\/u, '')]
		: [place];
	return `${display.model} (${details.filter((part) => part !== '').join(', ')})`;
}
