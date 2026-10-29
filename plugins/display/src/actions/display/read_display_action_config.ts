import type { DisplayActionConfig } from './display_action_config';
import { displayActionSettingsSchema } from './display_action_settings_schema';
import type { MonitorTarget } from './monitor_target';
import { MonitorTargetValues } from './monitor_target_values';

const Defaults = {
	value: 50,
	step: 5,
	preset: 50,
} as const;

function readTarget(
	value: string | undefined,
	offersAll: boolean
): MonitorTarget {
	const trimmed = value?.trim();
	if (
		trimmed === undefined ||
		trimmed === '' ||
		trimmed === MonitorTargetValues.primary
	) {
		return { kind: 'primary' };
	}
	if (trimmed === MonitorTargetValues.all) {
		return offersAll ? { kind: 'all' } : { kind: 'primary' };
	}
	return { kind: 'monitor', monitorId: trimmed };
}

/** Reads the settings of a display action from its raw settings; missing or invalid ones fall back to the defaults. */
export function readDisplayActionConfig(
	rawSettings: unknown,
	options: Readonly<{ offersAll: boolean }>
): DisplayActionConfig {
	const parsed = displayActionSettingsSchema.safeParse(rawSettings);
	const settings = parsed.success ? parsed.data : {};
	return {
		target: readTarget(settings.monitor, options.offersAll),
		brightnessControl: settings.brightnessControl ?? 'auto',
		offMode: settings.offMode ?? 'blackScreen',
		brightnessKeyMode: settings.brightnessKeyMode ?? 'set',
		value: settings.value ?? Defaults.value,
		step:
			settings.step === undefined || settings.step === 0
				? Defaults.step
				: settings.step,
		preset: settings.preset ?? Defaults.preset,
	};
}
