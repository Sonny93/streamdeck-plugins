import type { Language } from 'deck-kit/i18n/language';

import type { AudioFlow } from '../../audio/audio_flow';
import type { AudioSnapshot } from '../../audio/audio_snapshot';
import { audioMessages } from '../../i18n/audio_messages';
import type { AudioDeviceChoices } from './audio_device_choices';
import { AudioTargetValues } from './audio_target_values';

type Choice = Readonly<{ label: string; value: string }>;
type ChoiceGroup = Readonly<{ label: string; children: Choice[] }>;

function buildDefaultChoice(flow: AudioFlow, language: Language): Choice {
	return flow === 'output'
		? {
				label: audioMessages.text('defaultOutput', language),
				value: AudioTargetValues.defaultOutput,
			}
		: {
				label: audioMessages.text('defaultInput', language),
				value: AudioTargetValues.defaultInput,
			};
}

function buildGroupLabel(flow: AudioFlow, language: Language): string {
	return audioMessages.text(
		flow === 'output' ? 'outputsGroup' : 'inputsGroup',
		language
	);
}

/**
 * Lists the devices an action can be set to, grouped as sdpi-components `datasource` items.
 * The device already picked stays listed while it is unplugged, so the picker keeps showing it.
 */
export function listAudioDeviceChoices(
	options: Readonly<{
		language: Language;
		snapshot: AudioSnapshot | undefined;
		choices: AudioDeviceChoices;
		pickedValue: string | undefined;
	}>
): Array<Choice | ChoiceGroup> {
	const { language, snapshot, choices, pickedValue } = options;
	const groups: Array<Choice | ChoiceGroup> = [];
	if (choices.offersDefaults) {
		groups.push({
			label: audioMessages.text('followSystem', language),
			children: choices.flows.map((flow) => buildDefaultChoice(flow, language)),
		});
	}
	for (const flow of choices.flows) {
		groups.push({
			label: buildGroupLabel(flow, language),
			children: (snapshot?.devices ?? [])
				.filter((device) => device.flow === flow)
				.map((device) => ({ label: device.name, value: device.id })),
		});
	}
	const isListed = groups.some((group) =>
		'children' in group
			? group.children.some((choice) => choice.value === pickedValue)
			: group.value === pickedValue
	);
	if (pickedValue === undefined || pickedValue === '' || isListed) {
		return groups;
	}
	return [
		{
			label: audioMessages.text('unpluggedDevice', language),
			value: pickedValue,
		},
		...groups,
	];
}
