/** Reads `application.process.id` from a properties object, which pactl prints as a string. */
export function readProcessIdProperty(
	properties: Readonly<Record<string, unknown>>
): number | undefined {
	const value = properties['application.process.id'];
	const processId = typeof value === 'string' ? Number(value) : Number.NaN;
	return Number.isInteger(processId) && processId > 0 ? processId : undefined;
}
