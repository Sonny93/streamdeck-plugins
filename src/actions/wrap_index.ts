/**
 * Maps an unbounded position onto a list of `length` items: the position is rounded, then wrapped around both ends.
 * Returns 0 for an empty list.
 */
export function wrapIndex(
	options: Readonly<{ index: number; length: number }>
): number {
	if (options.length <= 0) {
		return 0;
	}
	const wrapped = Math.round(options.index) % options.length;
	return (wrapped + options.length) % options.length;
}
