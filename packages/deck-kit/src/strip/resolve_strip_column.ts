import { StripPanel } from './strip_panel';

/**
 * The slot of the touch strip a dial draws, from the coordinates the SDK gives its action.
 * Slot 0, the first, when there are none or they are out of the strip.
 */
export function resolveStripColumn(
	coordinates: Readonly<{ column: number }> | undefined
): number {
	const column = coordinates?.column;
	if (
		column === undefined ||
		!Number.isInteger(column) ||
		column < 0 ||
		column >= StripPanel.slotCount
	) {
		return 0;
	}
	return column;
}
