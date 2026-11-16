import { describe, expect, it } from 'vitest';

import { listIconVariants } from './list_icon_variants.ts';
import { PackIcons } from './pack_icons.ts';

describe('listIconVariants', () => {
	it('gives every icon an unlabeled image, then a top and a bottom image per language', () => {
		const [backIcon] = PackIcons.filter((icon) => icon.id === 'back');
		if (backIcon === undefined) {
			throw new TypeError('the pack has no back icon');
		}

		expect(
			listIconVariants(backIcon).map((variant) => variant.fileName)
		).toEqual([
			'back.png',
			'back-label-top-en.png',
			'back-label-bottom-en.png',
			'back-label-top-fr.png',
			'back-label-bottom-fr.png',
		]);
	});

	it('names every image of the pack differently', () => {
		const fileNames = PackIcons.flatMap(listIconVariants).map(
			(variant) => variant.fileName
		);

		expect(new Set(fileNames).size).toBe(fileNames.length);
	});
});

describe('pack labels', () => {
	it('should name the French variant with its language and draw the French label', () => {
		const displayIcon = PackIcons.find((icon) => icon.id === 'display-folder');
		const frenchVariant = displayIcon
			? listIconVariants(displayIcon).find(
					(variant) => variant.fileName === 'display-folder-label-bottom-fr.png'
				)
			: undefined;

		expect(frenchVariant?.name).toBe(
			'Display folder, label at the bottom (French)'
		);
		expect(frenchVariant?.svg).toContain('>Affichage</text>');
	});
});
