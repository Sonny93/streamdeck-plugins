import { describe, expect, it } from 'vitest';

import { buildDialBackdrop } from './build_dial_backdrop';

const COVER = 'data:image/jpeg;base64,AQID';

describe('buildDialBackdrop', () => {
	it('should draw nothing without backdrop', () => {
		expect(buildDialBackdrop(undefined)).toBe('');
	});

	it('should draw the slice of the dial column of the cover stretched over the strip, dimmed', () => {
		expect(buildDialBackdrop({ coverDataUrl: COVER, column: 2 })).toBe(
			`<image x="-400" y="-350" width="800" height="800" preserveAspectRatio="xMidYMid slice" opacity="0.25" xlink:href="${COVER}"/>`
		);
	});
});
