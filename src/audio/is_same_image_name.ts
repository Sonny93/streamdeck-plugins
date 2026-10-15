/** Compares two executable names the way Windows does, ignoring case. */
export function isSameImageName(first: string, second: string): boolean {
	return first.toLowerCase() === second.toLowerCase();
}
