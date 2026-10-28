const SVG_DECIMALS = 2;

/** Formats a coordinate for an SVG attribute, keeping at most two decimals. */
export function formatSvgNumber(value: number): string {
	return String(Number(value.toFixed(SVG_DECIMALS)));
}
