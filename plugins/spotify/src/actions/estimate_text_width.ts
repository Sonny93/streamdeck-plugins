const FIRST_CHARACTER_CODE = 32;
const UNITS_PER_EM = 1000;
const FALLBACK_WIDTH = 556;
const WIDE_WIDTH = 1000;
const WIDE_CHARACTERS_FROM = 0x2e80;

/** Advance widths of Arial (per 1000 units of em) for the printable ASCII characters, space first. */
const REGULAR_WIDTHS = [
	278, 278, 355, 556, 556, 889, 667, 191, 333, 333, 389, 584, 278, 333, 278,
	278, 556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 278, 278, 584, 584,
	584, 556, 1015, 667, 667, 722, 722, 667, 611, 778, 722, 278, 500, 667, 556,
	833, 722, 778, 667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 278,
	278, 278, 469, 556, 333, 556, 556, 500, 556, 556, 278, 556, 556, 222, 222,
	500, 222, 833, 556, 556, 556, 556, 333, 500, 278, 556, 500, 722, 500, 500,
	500, 334, 260, 334, 584,
];

/** Advance widths of Arial Bold (per 1000 units of em) for the printable ASCII characters, space first. */
const BOLD_WIDTHS = [
	278, 333, 474, 556, 556, 889, 722, 238, 333, 333, 389, 584, 278, 333, 278,
	278, 556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 333, 333, 584, 584,
	584, 611, 975, 722, 722, 722, 722, 667, 611, 778, 722, 278, 556, 722, 611,
	833, 722, 778, 667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 333,
	278, 333, 584, 556, 333, 556, 611, 556, 611, 556, 333, 611, 611, 278, 278,
	556, 278, 889, 611, 611, 611, 611, 389, 556, 333, 611, 556, 778, 556, 556,
	500, 389, 280, 389, 584,
];

function readCharacterWidth(
	character: string,
	widths: readonly number[]
): number {
	const [base = character] = character.normalize('NFD');
	const code = base.codePointAt(0) ?? FIRST_CHARACTER_CODE;
	const width = widths[code - FIRST_CHARACTER_CODE];
	if (width !== undefined) {
		return width;
	}
	return code >= WIDE_CHARACTERS_FROM ? WIDE_WIDTH : FALLBACK_WIDTH;
}

/**
 * Estimates how wide a text is drawn in Arial, in pixels: accented letters count as their base letter,
 * other characters outside ASCII as an average letter, or a full em from the CJK ranges on.
 */
export function estimateTextWidth(
	options: Readonly<{ text: string; fontSize: number; isBold: boolean }>
): number {
	const widths = options.isBold ? BOLD_WIDTHS : REGULAR_WIDTHS;
	const units = Array.from(options.text).reduce(
		(total, character) => total + readCharacterWidth(character, widths),
		0
	);
	return (units * options.fontSize) / UNITS_PER_EM;
}
