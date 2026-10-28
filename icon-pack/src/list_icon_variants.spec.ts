import { describe, expect, it } from 'vitest';

import { listIconVariants } from './list_icon_variants.ts';
import { PackIcons } from './pack_icons.ts';

describe('listIconVariants', () => {
	it('gives every icon a top, a bottom and an unlabeled image', () => {
		const [backIcon] = PackIcons.filter((icon) => icon.id === 'back');
		if (backIcon === undefined) {
			throw new TypeError('the pack has no back icon');
		}

		expect(
			listIconVariants(backIcon).map((variant) => variant.fileName)
		).toEqual(['back-label-top.png', 'back-label-bottom.png', 'back.png']);
	});

	it('names every image of the pack differently', () => {
		const fileNames = PackIcons.flatMap(listIconVariants).map(
			(variant) => variant.fileName
		);

		expect(new Set(fileNames).size).toBe(fileNames.length);
	});
});
