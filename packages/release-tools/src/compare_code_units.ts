/** Orders two strings by UTF-16 code unit, which gives the same order on every machine and locale. */
export function compareCodeUnits(first: string, second: string): number {
	if (first < second) {
		return -1;
	}
	return first > second ? 1 : 0;
}
