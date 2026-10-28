import type { DialBackdrop } from './dial_backdrop';

/** Describes the backdrop of a dial in `column`: the playing track's cover when it is downloaded, otherwise none. */
export function toDialBackdrop(
	coverDataUrl: string | undefined,
	column: number
): DialBackdrop | undefined {
	return coverDataUrl === undefined ? undefined : { coverDataUrl, column };
}
