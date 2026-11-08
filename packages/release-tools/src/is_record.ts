/** Tells whether a parsed JSON value is an object that is neither `null` nor an array. */
export function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}
