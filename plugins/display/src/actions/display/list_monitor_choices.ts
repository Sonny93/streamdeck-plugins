import type { Language } from 'deck-kit/i18n/language';

import type { DisplaySnapshot } from '../../displays/display_snapshot';
import { displayMessages } from '../../i18n/display_messages';
import { MonitorTargetValues } from './monitor_target_values';

type Choice = Readonly<{ label: string; value: string }>;

/**
 * Lists the monitors an action can be set to, as sdpi-components `datasource` items.
 * The monitor already picked stays listed while the system does not light it, so the picker keeps showing it.
 */
export function listMonitorChoices(
	options: Readonly<{
		language: Language;
		snapshot: DisplaySnapshot | undefined;
		offersAll: boolean;
		pickedValue: string | undefined;
	}>
): Choice[] {
	const choices: Choice[] = [
		{
			label: displayMessages.text('mainMonitor', options.language),
			value: MonitorTargetValues.primary,
		},
		...(options.offersAll
			? [
					{
						label: displayMessages.text('allMonitors', options.language),
						value: MonitorTargetValues.all,
					},
				]
			: []),
		...(options.snapshot?.monitors ?? []).map((monitor) => ({
			label: monitor.name,
			value: monitor.id,
		})),
	];
	const { pickedValue } = options;
	if (
		pickedValue === undefined ||
		pickedValue === '' ||
		choices.some((choice) => choice.value === pickedValue)
	) {
		return choices;
	}
	return [
		...choices,
		{
			label: displayMessages.text('monitorNotLit', options.language),
			value: pickedValue,
		},
	];
}
