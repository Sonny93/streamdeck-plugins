import { describe, expect, it } from 'vitest';

import { parseFontMatch } from './parse_font_match';

describe('parseFontMatch', () => {
	it('should read the family and the file of a match', () => {
		expect(
			parseFontMatch(
				'Liberation Sans\t/usr/share/fonts/liberation/LiberationSans-Regular.ttf\n'
			)
		).toStrictEqual({
			family: 'Liberation Sans',
			file: '/usr/share/fonts/liberation/LiberationSans-Regular.ttf',
		});
	});

	it('should keep the first of several family names', () => {
		expect(
			parseFontMatch('Noto Sans,Noto Sans Regular\t/usr/share/NotoSans.ttf')
		).toMatchObject({ family: 'Noto Sans' });
	});

	it('should return undefined for an empty output', () => {
		expect(parseFontMatch('')).toBeUndefined();
	});
});
