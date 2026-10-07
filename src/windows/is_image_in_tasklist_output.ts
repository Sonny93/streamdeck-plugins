const FIRST_CSV_FIELD_PATTERN = /^"([^"]*)"/;
const LINE_BREAK_PATTERN = /\r?\n/;

function readImageName(line: string): string | undefined {
	return FIRST_CSV_FIELD_PATTERN.exec(line.trim())?.[1];
}

/** Tells whether the CSV output of `tasklist /FO CSV /NH` lists at least one process of the image, ignoring localized "no tasks" info lines. */
export function isImageInTasklistOutput(
	options: Readonly<{ output: string; imageName: string }>
): boolean {
	const expected = options.imageName.toLowerCase();
	return options.output
		.split(LINE_BREAK_PATTERN)
		.some((line) => readImageName(line)?.toLowerCase() === expected);
}
