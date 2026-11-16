import type { Language } from 'deck-kit/i18n/language';

import type { AudioSnapshot } from '../../audio/audio_snapshot';
import type { AudioTarget } from '../../audio/audio_target';
import { resolveAudioDevice } from '../../audio/resolve_audio_device';
import { audioMessages } from '../../i18n/audio_messages';
import type { AudioStripModel } from './audio_strip_model';

const PERCENT = 100;

function buildEmptyTitle(target: AudioTarget, language: Language): string {
	if (target.kind === 'device') {
		return audioMessages.text('volumeTitle', language);
	}
	return audioMessages.text(
		target.flow === 'output' ? 'outputTitle' : 'inputTitle',
		language
	);
}

function buildMessageModel(title: string, message: string): AudioStripModel {
	return {
		title,
		valueText: message,
		isMessage: true,
		percent: undefined,
		isMuted: false,
	};
}

/**
 * What a strip shows about the device a target points to: its name, its volume or the word "Muted" (the bar keeps the volume),
 * or a message that says why there is nothing to show. Without a snapshot the message is "Unavailable", so no old value looks fresh.
 */
export function resolveAudioStripModel(
	options: Readonly<{
		snapshot: AudioSnapshot | undefined;
		target: AudioTarget;
		language: Language;
	}>
): AudioStripModel {
	const { snapshot, target, language } = options;
	const emptyTitle = buildEmptyTitle(target, language);
	if (snapshot === undefined) {
		return buildMessageModel(
			emptyTitle,
			audioMessages.text('unavailable', language)
		);
	}
	const device = resolveAudioDevice(snapshot, target);
	const volume = device === undefined ? undefined : snapshot.volumes[device.id];
	if (device === undefined || volume === undefined) {
		return buildMessageModel(
			emptyTitle,
			audioMessages.text('noDevice', language)
		);
	}
	return {
		title: device.name,
		valueText: volume.isMuted
			? audioMessages.text('muted', language)
			: `${String(Math.round(volume.level * PERCENT))} %`,
		isMessage: volume.isMuted,
		percent: Math.round(volume.level * PERCENT),
		isMuted: volume.isMuted,
	};
}
