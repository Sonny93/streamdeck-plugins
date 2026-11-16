import type { Language } from 'deck-kit/i18n/language';
import { DrawnKeyImages } from 'deck-kit/keys/drawn_key_images';
import type { KeyAppearance } from 'deck-kit/keys/key_appearance';
import { readKeyLabel } from 'deck-kit/keys/read_key_label';

type ImageTarget = Parameters<DrawnKeyImages['draw']>[0];

/**
 * The drawn images of the keys of an action, whose default label depends on the language.
 * It keeps the raw settings of each key, so a language change works the labels out again.
 */
export class LocalizedKeyImages {
	private readonly images = new DrawnKeyImages();
	private readonly rawSettings = new Map<string, unknown>();

	/** `defaultLabel` gives the label drawn while none is typed in the settings, `undefined` to keep the manifest images. */
	constructor(
		private readonly defaultLabel: (language: Language) => string | undefined
	) {}

	/** Keeps the settings of a key and works its label out in a language. */
	keep(keyId: string, rawSettings: unknown, language: Language): void {
		this.rawSettings.set(keyId, rawSettings);
		this.images.setLabel(
			keyId,
			readKeyLabel(rawSettings, this.defaultLabel(language))
		);
	}

	/** Works the labels of every kept key out again, for a language change. */
	relabel(language: Language): void {
		for (const [keyId, rawSettings] of this.rawSettings) {
			this.keep(keyId, rawSettings, language);
		}
	}

	forget(keyId: string): void {
		this.rawSettings.delete(keyId);
		this.images.forget(keyId);
	}

	draw(key: ImageTarget, appearance: KeyAppearance): Promise<void> {
		return this.images.draw(key, appearance);
	}
}
