import type { AudioFlow } from '../../audio/audio_flow';
import { AudioTargetValues } from './audio_target_values';
import type { AudioSnapshot } from '../../audio/audio_snapshot';
import type { AudioDeviceChoices } from './audio_device_choices';

type Choice = Readonly<{ label: string; value: string }>;
type ChoiceGroup = Readonly<{ label: string; children: Choice[] }>;

const FLOW_GROUP_LABELS: Readonly<Record<AudioFlow, string>> = {
	output: 'Outputs',
	input: 'Inputs',
};

const DEFAULT_CHOICES: Readonly<Record<AudioFlow, Choice>> = {
	output: { label: 'Default output', value: AudioTargetValues.defaultOutput },
	input: { label: 'Default input', value: AudioTargetValues.defaultInput },
};

const UNPLUGGED_LABEL = 'Unplugged device';

/**
 * Lists the devices an action can be set to, grouped as sdpi-components `datasource` items.
 * The device already picked stays listed while it is unplugged, so the picker keeps showing it.
 */
export function listAudioDeviceChoices(
	options: Readonly<{
		snapshot: AudioSnapshot | undefined;
		choices: AudioDeviceChoices;
		pickedValue: string | undefined;
	}>
): Array<Choice | ChoiceGroup> {
	const { snapshot, choices, pickedValue } = options;
	const groups: Array<Choice | ChoiceGroup> = [];
	if (choices.offersDefaults) {
		groups.push({
			label: 'Follow Windows',
			children: choices.flows.map((flow) => DEFAULT_CHOICES[flow]),
		});
	}
	for (const flow of choices.flows) {
		groups.push({
			label: FLOW_GROUP_LABELS[flow],
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
	return [{ label: UNPLUGGED_LABEL, value: pickedValue }, ...groups];
}
