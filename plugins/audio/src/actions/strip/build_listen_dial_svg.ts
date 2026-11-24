import type { Language } from 'deck-kit/i18n/language';

import type { ListenView } from '../../listen/listen_view';
import { buildListenStripContent } from './build_listen_strip_content';
import { resolveListenStripModel } from './resolve_listen_strip_model';
import { wrapAudioStripSvg } from './wrap_audio_strip_svg';

/**
 * Draws the strip of a "Listen" dial over its slice (`column`) of the continuous background: the name of its input, its level,
 * the state in words ("Listening" in amber over the amber background, "Off" in grey) and a bar of the level against the ceiling.
 * Without a hub, an input picked, or while the input is unplugged, the picture is dimmed and says why in words.
 */
export function buildListenDialSvg(
	options: Readonly<{
		view: ListenView | undefined;
		sourceId: string | undefined;
		level: number;
		maximumLevel: number;
		language: Language;
		column?: number;
	}>
): string {
	const model = resolveListenStripModel(options);
	return wrapAudioStripSvg({
		tone: model.isListening ? 'amber' : 'neutral',
		column: options.column,
		content: buildListenStripContent(model),
		isDimmed: !model.isAvailable,
	});
}
