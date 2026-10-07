/**
 * Moves a selection index by a number of ticks, wrapping around both ends of a list of `length` items.
 * Returns 0 for an empty list.
 */
export function moveSelection(
	options: Readonly<{ index: number; ticks: number; length: number }>
): number {
	if (options.length <= 0) {
		return 0;
	}
	const moved = (options.index + options.ticks) % options.length;
	return (moved + options.length) % options.length;
}
