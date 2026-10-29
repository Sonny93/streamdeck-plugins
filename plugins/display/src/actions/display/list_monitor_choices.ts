import type { DisplaySnapshot } from '../../displays/display_snapshot';
import { MonitorTargetValues } from './monitor_target_values';

type Choice = Readonly<{ label: string; value: string }>;

const UNPLUGGED_LABEL = 'Monitor not lit';

/**
 * Lists the monitors an action can be set to, as sdpi-components `datasource` items.
 * The monitor already picked stays listed while Windows does not light it, so the picker keeps showing it.
 */
export function listMonitorChoices(
	options: Readonly<{
		snapshot: DisplaySnapshot | undefined;
		offersAll: boolean;
		pickedValue: string | undefined;
	}>
): Choice[] {
	const choices: Choice[] = [
		{ label: 'Main monitor', value: MonitorTargetValues.primary },
		...(options.offersAll
			? [{ label: 'All monitors', value: MonitorTargetValues.all }]
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
	return [...choices, { label: UNPLUGGED_LABEL, value: pickedValue }];
}
