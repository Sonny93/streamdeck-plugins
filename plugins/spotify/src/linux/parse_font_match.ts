const FIELD_SEPARATOR = '\t';
const FAMILY_SEPARATOR = ',';

/** Reads the line `fc-match -f '%{family}\t%{file}\n'` prints: the first family name and the font file. */
export function parseFontMatch(
	output: string
): Readonly<{ family: string; file: string }> | undefined {
	const [families = '', file = ''] = output.trim().split(FIELD_SEPARATOR);
	const [family = ''] = families.split(FAMILY_SEPARATOR);
	return family === '' || file === '' ? undefined : { family, file };
}
