const LATIN_MAX_CODE_POINT = 0x24f;
const PUNCTUATION_MIN_CODE_POINT = 0x2000;
const PUNCTUATION_MAX_CODE_POINT = 0x206f;
const MAX_CODE_POINTS = 32;

function isDrawnByMainFonts(codePoint: number): boolean {
	return (
		codePoint <= LATIN_MAX_CODE_POINT ||
		(codePoint >= PUNCTUATION_MIN_CODE_POINT &&
			codePoint <= PUNCTUATION_MAX_CODE_POINT)
	);
}

/**
 * Lists the distinct characters of a document beyond Latin letters and common punctuation (CJK, emoji, symbols), which the two main fonts cannot draw.
 * The list stops at 32 characters: a few fallback fonts cover any title, and each extra lookup costs a process.
 */
export function listFallbackCodePoints(svg: string): number[] {
	const found = new Set<number>();
	for (let position = 0; position < svg.length; position += 1) {
		const codePoint = svg.codePointAt(position) ?? 0;
		if (codePoint > 0xffff) {
			position += 1;
		}
		if (!isDrawnByMainFonts(codePoint)) {
			found.add(codePoint);
		}
		if (found.size >= MAX_CODE_POINTS) {
			break;
		}
	}
	return [...found];
}
