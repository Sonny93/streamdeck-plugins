import { formatDecimal } from 'deck-kit/i18n/format_decimal';
import type { Language } from 'deck-kit/i18n/language';

import { audioMessages } from '../../i18n/audio_messages';
import type { ListenView } from '../../listen/listen_view';
import type { ListenStripModel } from './listen_strip_model';

const PERCENT = 100;
const DECIMAL_SCALE = 10;

function formatLevel(level: number, language: Language): string {
	const percent = Math.round(level * PERCENT * DECIMAL_SCALE) / DECIMAL_SCALE;
	const figure = Number.isInteger(percent)
		? String(percent)
		: formatDecimal(percent, 1, language);
	return `${figure} %`;
}

function buildUnavailableModel(
	title: string,
	messageText: string
): ListenStripModel {
	return {
		title,
		levelText: '',
		stateText: '',
		messageText,
		barFraction: 0,
		isListening: false,
		isAvailable: false,
	};
}

/**
 * What a "Listen" strip shows about the input of a dial: its name, its level, a bar of the level against the ceiling and the state in words.
 * Without a hub, an input picked, or while the input is unplugged, it says why there is nothing to show.
 */
export function resolveListenStripModel(
	options: Readonly<{
		view: ListenView | undefined;
		sourceId: string | undefined;
		level: number;
		maximumLevel: number;
		language: Language;
	}>
): ListenStripModel {
	const { view, sourceId, level, maximumLevel, language } = options;
	const emptyTitle = audioMessages.text('listenTitle', language);
	if (sourceId === undefined) {
		return buildUnavailableModel(
			emptyTitle,
			audioMessages.text('noInputPicked', language)
		);
	}
	const source = view?.sources.find((candidate) => candidate.id === sourceId);
	if (view === undefined || source === undefined) {
		return buildUnavailableModel(
			emptyTitle,
			audioMessages.text('unavailable', language)
		);
	}
	const isListening = view.listenedSourceIds.has(sourceId);
	return {
		title: source.name,
		levelText: formatLevel(level, language),
		stateText: audioMessages.text(
			isListening ? 'listening' : 'listenOff',
			language
		),
		messageText: '',
		barFraction: Math.min(1, Math.max(0, level / maximumLevel)),
		isListening,
		isAvailable: true,
	};
}
