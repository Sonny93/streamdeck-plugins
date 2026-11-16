import type { Language } from 'deck-kit/i18n/language';
import { buildStripMessageSvg } from 'deck-kit/strip/build_strip_message_svg';
import { resolveStripColumn } from 'deck-kit/strip/resolve_strip_column';

import type { AudioSnapshot } from '../../audio/audio_snapshot';
import type { AudioTarget } from '../../audio/audio_target';
import { audioMessages } from '../../i18n/audio_messages';
import type { VoltStatus } from '../../volt/volt_status';
import { buildAudioStripContent } from './build_audio_strip_content';
import { buildVoltStripContent } from './build_volt_strip_content';
import { resolveAudioStripModel } from './resolve_audio_strip_model';
import { resolveStripTone } from './resolve_strip_tone';
import { StripPalette } from './strip_palette';
import { StripTones } from './strip_tones';
import { wrapAudioStripSvg } from './wrap_audio_strip_svg';

const OUTPUT_COLUMN = 0;
const INPUT_COLUMN = 1;
const VOLT_COLUMN = 2;
const OUTPUT_TARGET: AudioTarget = { kind: 'default', flow: 'output' };
const INPUT_TARGET: AudioTarget = { kind: 'default', flow: 'input' };

type AudioPanelOptions = Readonly<{
	snapshot: AudioSnapshot | undefined;
	voltStatus: VoltStatus;
	language: Language;
	column?: number;
}>;

function buildModels(options: AudioPanelOptions) {
	const { snapshot, language } = options;
	return [OUTPUT_TARGET, INPUT_TARGET].map((target) =>
		resolveAudioStripModel({ snapshot, target, language })
	);
}

/**
 * The slice that the dial of one column draws of the idle panel: the default output in the first slot and the default input in the second
 * (name, volume with a bar, "Muted" and the dimming), the Volt 1 in the third (Monitor, Vintage and 48V read-only, or why it has no state),
 * and the plain background in the fourth.
 * Without a snapshot the two device slots draw "Unavailable", so no old value looks fresh, over the neutral background;
 * the Volt 1 slot follows its own status, which does not come from the snapshot.
 */
export function buildAudioPanelSvg(options: AudioPanelOptions): string {
	const column = resolveStripColumn({ column: options.column ?? 0 });
	const { snapshot, voltStatus, language } = options;
	const models = buildModels(options);
	const tone = resolveStripTone(snapshot === undefined ? [] : models);
	if (column === VOLT_COLUMN) {
		return wrapAudioStripSvg({
			tone,
			column,
			content: buildVoltStripContent(voltStatus, language),
		});
	}
	const model = column === OUTPUT_COLUMN ? models[0] : models[1];
	if (column !== OUTPUT_COLUMN && column !== INPUT_COLUMN) {
		return wrapAudioStripSvg({ tone, column, content: '' });
	}
	if (snapshot === undefined || model === undefined) {
		return buildStripMessageSvg({
			message: audioMessages.text('unavailable', language),
			color: StripPalette.primary,
			tone: StripTones.neutral,
			column,
		});
	}
	return wrapAudioStripSvg({
		tone,
		column,
		content: buildAudioStripContent(model),
		isDimmed: model.isMuted,
	});
}
