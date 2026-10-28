const ELLIPSIS = '…';

/** Keeps a text that `fits`, otherwise shortens it as little as needed so that, ended with an ellipsis, it fits. */
export function fitText(
	options: Readonly<{ text: string; fits: (text: string) => boolean }>
): string {
	if (options.fits(options.text)) {
		return options.text;
	}
	const characters = Array.from(options.text);
	for (let length = characters.length - 1; length > 0; length -= 1) {
		const candidate = `${characters.slice(0, length).join('').trimEnd()}${ELLIPSIS}`;
		if (options.fits(candidate)) {
			return candidate;
		}
	}
	return ELLIPSIS;
}
