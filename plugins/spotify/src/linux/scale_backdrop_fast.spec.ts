import { describe, expect, it } from 'vitest';

import { buildBackdropImage } from '../actions/build_backdrop_image';
import { scaleBackdropFast } from './scale_backdrop_fast';

const COVER = 'data:image/png;base64,AQID';

describe('scaleBackdropFast', () => {
	it('should mark the backdrop image for nearest neighbour scaling', () => {
		const backdrop = buildBackdropImage({
			coverDataUrl: COVER,
			left: 0,
			opacity: 0.3,
		});

		expect(scaleBackdropFast(backdrop)).toMatch(
			/^<image image-rendering="optimizeSpeed" x="0"/
		);
	});

	it('should leave a small cover image smooth', () => {
		const cover = `<image x="8" y="8" width="84" height="84" xlink:href="${COVER}"/>`;

		expect(scaleBackdropFast(cover)).toBe(cover);
	});
});
