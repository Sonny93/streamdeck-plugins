import { describe, expect, it, vi } from 'vitest';

import { DrawnKeyImages } from './drawn_key_images';
import { KeyPalette } from './key_palette';
import { speakerGlyph } from './speaker_glyph';

const ACTIVE = { glyph: speakerGlyph, color: KeyPalette.active } as const;
const IDLE = { glyph: speakerGlyph, color: KeyPalette.idle } as const;

function createKey() {
	return {
		id: 'key',
		setImage: vi.fn<(image?: string) => Promise<void>>(() => Promise.resolve()),
	};
}

describe('DrawnKeyImages', () => {
	it('draws a labeled key once per change of look', async () => {
		const images = new DrawnKeyImages();
		const key = createKey();
		images.setLabel(key.id, { text: 'Casque', position: 'top' });

		await images.draw(key, ACTIVE);
		await images.draw(key, ACTIVE);
		await images.draw(key, IDLE);

		expect(key.setImage).toHaveBeenCalledTimes(2);
		expect(key.setImage.mock.calls[0]?.[0]).toMatch(/^data:image\/svg\+xml/);
	});

	it('gives the manifest images back to a key without label', async () => {
		const images = new DrawnKeyImages();
		const key = createKey();
		images.setLabel(key.id, undefined);

		await images.draw(key, ACTIVE);
		await images.draw(key, IDLE);

		expect(key.setImage).toHaveBeenCalledOnce();
		expect(key.setImage).toHaveBeenCalledWith(undefined);
	});

	it('sends the image again once the label changed', async () => {
		const images = new DrawnKeyImages();
		const key = createKey();
		images.setLabel(key.id, { text: 'Casque', position: 'top' });
		await images.draw(key, ACTIVE);

		images.setLabel(key.id, { text: 'Casque', position: 'bottom' });
		await images.draw(key, ACTIVE);

		expect(key.setImage).toHaveBeenCalledTimes(2);
	});
});
