import type { Language } from 'deck-kit/i18n/language';

import { audioMessages } from '../../i18n/audio_messages';
import type { ListenSource } from '../../listen/listen_source';

type Choice = Readonly<{ label: string; value: string }>;

/**
 * Lists the hardware inputs a listen action can be set to, as sdpi-components `datasource` items.
 * The input already picked stays listed while it is unplugged, so the picker keeps showing it.
 */
export function listListenSourceChoices(
	options: Readonly<{
		language: Language;
		sources: readonly ListenSource[];
		pickedValue: string | undefined;
	}>
): Choice[] {
	const { language, sources, pickedValue } = options;
	const choices = sources.map((source) => ({
		label: source.name,
		value: source.id,
	}));
	const isListed = choices.some((choice) => choice.value === pickedValue);
	if (pickedValue === undefined || pickedValue === '' || isListed) {
		return choices;
	}
	return [
		{
			label: audioMessages.text('unpluggedDevice', language),
			value: pickedValue,
		},
		...choices,
	];
}
