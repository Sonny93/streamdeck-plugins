import { describe, expect, it, vi } from 'vitest';

import { audioMessages } from '../../i18n/audio_messages';
import { LocalizedKeyImages } from './localized_key_images';
import { speakerGlyph } from './speaker_glyph';

const APPEARANCE = { glyph: speakerGlyph, color: '#FFB020' };

function decode(image: string | undefined): string {
	return Buffer.from((image ?? '').split(',')[1] ?? '', 'base64').toString(
		'utf8'
	);
}

function createKey() {
	const setImage = vi.fn((_image?: string) => Promise.resolve());
	return { id: 'key', setImage };
}

function createImages() {
	return new LocalizedKeyImages((language) =>
		audioMessages.text('muteKeyLabel', language)
	);
}

describe('LocalizedKeyImages', () => {
	it('should draw the default label in the language of the keep', async () => {
		const images = createImages();
		const key = createKey();
		images.keep(key.id, {}, 'fr');

		await images.draw(key, APPEARANCE);

		expect(decode(key.setImage.mock.calls[0]?.[0])).toContain('>Micro<');
	});

	it('should draw a typed label whatever the language', async () => {
		const images = createImages();
		const key = createKey();
		images.keep(key.id, { label: 'Casque' }, 'en');
		images.relabel('fr');

		await images.draw(key, APPEARANCE);

		expect(decode(key.setImage.mock.calls[0]?.[0])).toContain('>Casque<');
	});

	it('should draw the key again after the language changes its default label', async () => {
		const images = new LocalizedKeyImages((language) =>
			language === 'fr' ? 'Muet' : 'Muted'
		);
		const key = createKey();
		images.keep(key.id, {}, 'en');
		await images.draw(key, APPEARANCE);

		images.relabel('fr');
		await images.draw(key, APPEARANCE);

		expect(key.setImage).toHaveBeenCalledTimes(2);
		expect(decode(key.setImage.mock.calls[1]?.[0])).toContain('>Muet<');
	});

	it('should forget the settings of a key that disappeared', async () => {
		const images = new LocalizedKeyImages(() => 'Label');
		const key = createKey();
		images.keep(key.id, {}, 'en');
		images.forget(key.id);

		images.relabel('fr');
		await images.draw(key, APPEARANCE);

		expect(key.setImage).toHaveBeenCalledWith(undefined);
	});
});
