import { describe, expect, it } from 'vitest';

import { wrapText } from './wrap_text';

function fitsIn(maxLength: number): (row: string) => boolean {
	return (row) => Array.from(row).length <= maxLength;
}

describe('wrapText', () => {
	it('should keep a text that fits on one row', () => {
		expect(
			wrapText({ text: 'Me gustas tú', maxRows: 2, fits: fitsIn(20) })
		).toEqual(['Me gustas tú']);
	});

	it('should break between words', () => {
		expect(
			wrapText({
				text: 'Once de la noche en San Salvador',
				maxRows: 3,
				fits: fitsIn(16),
			})
		).toEqual(['Once de la noche', 'en San Salvador']);
	});

	it('should shorten the last row when the text needs more rows', () => {
		expect(
			wrapText({ text: 'one two three four five', maxRows: 2, fits: fitsIn(9) })
		).toEqual(['one two', 'three fo…']);
	});

	it('should cut a word too long for a row', () => {
		expect(
			wrapText({ text: 'abcdefghij', maxRows: 3, fits: fitsIn(4) })
		).toEqual(['abcd', 'efgh', 'ij']);
	});

	it('should ignore repeated spaces', () => {
		expect(wrapText({ text: ' a  b ', maxRows: 2, fits: fitsIn(5) })).toEqual([
			'a b',
		]);
	});

	it('should return no row for an empty text', () => {
		expect(wrapText({ text: '', maxRows: 2, fits: fitsIn(5) })).toEqual([]);
	});
});
