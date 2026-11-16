import type { Language } from 'deck-kit/i18n/language';

import type { AudioSnapshot } from '../../audio/audio_snapshot';
import type { AudioTarget } from '../../audio/audio_target';
import { buildAudioStripContent } from './build_audio_strip_content';
import { resolveAudioStripModel } from './resolve_audio_strip_model';
import { resolveStripTone } from './resolve_strip_tone';
import { wrapAudioStripSvg } from './wrap_audio_strip_svg';

/**
 * Draws the strip of a "Volume" dial over its slice (`column`) of the continuous background: the name of its device,
 * the volume large with a bar, and why there is nothing to show. While the device is muted the picture is dimmed over the neutral
 * background and says "Muted" in words. Texts are in `language`.
 */
export function buildVolumeDialSvg(
	options: Readonly<{
		snapshot: AudioSnapshot | undefined;
		target: AudioTarget;
		language: Language;
		column?: number;
	}>
): string {
	const model = resolveAudioStripModel(options);
	return wrapAudioStripSvg({
		tone: resolveStripTone([model]),
		column: options.column,
		content: buildAudioStripContent(model),
		isDimmed: model.isMuted,
	});
}
