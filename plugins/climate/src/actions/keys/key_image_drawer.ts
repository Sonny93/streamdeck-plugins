import { buildLabeledKeySvg } from 'deck-kit/keys/build_labeled_key_svg';
import { toSvgDataUrl } from 'deck-kit/text/to_svg_data_url';

import type { KeyDescription } from './key_description';
import { KeyStateColors } from './key_state_colors';

type ImageTarget = Readonly<{
	id: string;
	setImage: (image?: string) => Promise<unknown>;
}>;

/**
 * Draws the keys with their label in the color of their state; a key without label shows the images of the manifest.
 * An image is only sent again when it changed, since the keys are redrawn on every poll of the unit.
 */
export class KeyImageDrawer {
	/** Image last sent to each key, `undefined` for the manifest images; a key missing here has been sent nothing yet. */
	private readonly lastImages = new Map<string, string | undefined>();

	forget(keyId: string): void {
		this.lastImages.delete(keyId);
	}

	async draw(key: ImageTarget, description: KeyDescription): Promise<void> {
		const image =
			description.label === undefined
				? undefined
				: toSvgDataUrl(
						buildLabeledKeySvg({
							glyph: description.glyph,
							color: KeyStateColors[description.state],
							label: description.label,
						})
					);
		if (this.lastImages.has(key.id) && this.lastImages.get(key.id) === image) {
			return;
		}
		this.lastImages.set(key.id, image);
		await key.setImage(image);
	}
}
