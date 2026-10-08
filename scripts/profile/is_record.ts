/** Tells whether a value is a non-null, non-array object, so its properties can be read safely. */
export function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}
