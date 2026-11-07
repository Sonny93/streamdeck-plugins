const FIRST_CSV_FIELD = /^"([^"]*)"/u;

/**
 * Tells whether a `tasklist /fo csv /nh` output has a row for an image name.
 * The match is on the first field of a row, never on the INFO line tasklist prints when nothing matches, which may be localized.
 */
export function isImageListed(
	tasklistOutput: string,
	imageName: string
): boolean {
	const wantedName = imageName.toLowerCase();
	return tasklistOutput
		.split(/\r?\n/u)
		.some(
			(line) =>
				FIRST_CSV_FIELD.exec(line.trim())?.[1]?.toLowerCase() === wantedName
		);
}
