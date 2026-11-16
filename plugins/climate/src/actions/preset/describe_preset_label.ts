import type { Language } from 'deck-kit/i18n/language';

import type { FanRate, UnitMode } from '../../daikin/unit_types';
import { climateMessages } from '../../i18n/climate_messages';
import { getFanRateName } from '../shared/fan_rate_name';
import { formatTemperature } from '../shared/format_temperature';
import { getUnitModeName } from '../shared/unit_mode_name';

/** The label of a "Preset" key that has none typed: its mode and temperature, otherwise its fan rate. */
export function describePresetLabel(
	preset: Readonly<{
		mode: UnitMode | undefined;
		targetTemperature: number | undefined;
		fanRate: FanRate | undefined;
	}>,
	language: Language
): string {
	const parts = [
		preset.mode === undefined
			? undefined
			: getUnitModeName(preset.mode, language),
		preset.targetTemperature === undefined
			? undefined
			: formatTemperature(preset.targetTemperature, language),
	].filter((part) => part !== undefined);
	if (parts.length > 0) {
		return parts.join(' ');
	}
	return preset.fanRate === undefined
		? climateMessages.text('presetFallback', language)
		: climateMessages.text('fanWithRate', language, {
				rate: getFanRateName(preset.fanRate, language),
			});
}
