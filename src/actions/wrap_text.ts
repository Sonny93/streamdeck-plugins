import { fitText } from './fit_text';

const WORD_SEPARATOR = ' ';

function splitLongWord(
	word: string,
	fits: (text: string) => boolean
): string[] {
	const pieces: string[] = [];
	let piece = '';
	for (const character of Array.from(word)) {
		if (piece !== '' && !fits(`${piece}${character}`)) {
			pieces.push(piece);
			piece = '';
		}
		piece = `${piece}${character}`;
	}
	return piece === '' ? pieces : [...pieces, piece];
}

/**
 * Breaks a text into rows that each `fits`, between words (a word too long for a row is cut).
 * When the text needs more than `maxRows` rows, the last row takes the rest and is shortened with an ellipsis.
 */
export function wrapText(
	options: Readonly<{
		text: string;
		maxRows: number;
		fits: (row: string) => boolean;
	}>
): string[] {
	const { maxRows, fits } = options;
	const words = options.text
		.split(WORD_SEPARATOR)
		.filter((word) => word !== '')
		.flatMap((word) => splitLongWord(word, fits));
	const rows: string[] = [];
	for (const word of words) {
		const last = rows.at(-1);
		const candidate =
			last === undefined ? word : `${last}${WORD_SEPARATOR}${word}`;
		if (last !== undefined && fits(candidate)) {
			rows[rows.length - 1] = candidate;
		} else {
			rows.push(word);
		}
	}
	if (rows.length <= maxRows) {
		return rows;
	}
	const rest = rows.slice(maxRows - 1).join(WORD_SEPARATOR);
	return [...rows.slice(0, maxRows - 1), fitText({ text: rest, fits })];
}
