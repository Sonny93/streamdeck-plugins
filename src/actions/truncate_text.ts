const ELLIPSIS = '…';

/** Shortens a text to at most `maxLength` characters, ending it with an ellipsis when it was cut. */
export function truncateText(
	options: Readonly<{ text: string; maxLength: number }>
): string {
	const characters = Array.from(options.text);
	if (characters.length <= options.maxLength) {
		return options.text;
	}
	const kept = characters.slice(0, options.maxLength - ELLIPSIS.length);
	return `${kept.join('').trimEnd()}${ELLIPSIS}`;
}
