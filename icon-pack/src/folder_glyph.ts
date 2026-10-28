const FOLDER_PATH =
	'M3 6.5A1.5 1.5 0 0 1 4.5 5h4.3l2 2.5h8.7A1.5 1.5 0 0 1 21 9v9.5a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18.5z';

/** A folder drawn in a 24×24 box, with `inside` drawn over it in the same color. */
export function folderGlyph(color: string, inside = ''): string {
	return `<g fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${FOLDER_PATH}"/>${inside}</g>`;
}
