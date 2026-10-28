import type { KeyLabel } from './key_label';
import type { KeyAppearance } from './key_appearance';
import { toSvgDataUrl } from '../../shared/to_svg_data_url';
import { buildLabeledKeySvg } from './build_labeled_key_svg';

type ImageTarget = Readonly<{
	id: string;
	setImage: (image?: string) => Promise<unknown>;
}>;

/**
 * Keeps the label of each key of an action and draws the key with it, so the label takes the color of the icon.
 * A key without label shows the images of the manifest; an image is only sent again when it changed.
 */
export class DrawnKeyImages {
	private readonly labels = new Map<string, KeyLabel | undefined>();
	/** Image last sent to each key, `undefined` for the manifest images; a key missing here has been sent nothing yet. */
	private readonly lastImages = new Map<string, string | undefined>();

	/** Keeps the label of a key and forgets its last image, so the next draw sends it again. */
	setLabel(keyId: string, label: KeyLabel | undefined): void {
		this.labels.set(keyId, label);
		this.lastImages.delete(keyId);
	}

	forget(keyId: string): void {
		this.labels.delete(keyId);
		this.lastImages.delete(keyId);
	}

	async draw(key: ImageTarget, appearance: KeyAppearance): Promise<void> {
		const label = this.labels.get(key.id);
		const image =
			label === undefined
				? undefined
				: toSvgDataUrl(buildLabeledKeySvg({ ...appearance, label }));
		if (this.lastImages.has(key.id) && this.lastImages.get(key.id) === image) {
			return;
		}
		this.lastImages.set(key.id, image);
		await key.setImage(image);
	}
}
