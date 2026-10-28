/** Formats the 1-based position of a playlist in the list, e.g. `12 / 39`; empty when the list is empty. */
export function formatPlaylistPosition(
	options: Readonly<{ index: number; total: number }>
): string {
	if (options.total <= 0) {
		return '';
	}
	return `${options.index + 1} / ${options.total}`;
}
