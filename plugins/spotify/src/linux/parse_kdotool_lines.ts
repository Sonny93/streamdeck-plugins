/** Splits kdotool's stdout into its non-empty lines: one window id or pid per line. */
export function parseKdotoolLines(output: string): string[] {
	return output
		.split('\n')
		.map((line) => line.trim())
		.filter((line) => line !== '');
}
