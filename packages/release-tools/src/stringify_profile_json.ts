/** Serializes a profile JSON file the way the import writes it: tabs and a final newline. */
export function stringifyProfileJson(value: unknown): string {
	return `${JSON.stringify(value, null, '\t')}\n`;
}
