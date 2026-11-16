import type { KeyDownEvent } from '@elgato/streamdeck';
import type { Language } from 'deck-kit/i18n/language';

import { ClimateTiming } from '../../climate/climate_timing';
import type { ClimateView } from '../../climate/climate_view';
import type { KeyDescription } from '../keys/key_description';
import type { ClimateActionSettings } from '../shared/climate_action_settings';
import { ClimateKeyAction } from '../shared/climate_key_action';
import { describeFanKey } from './describe_fan_key';
import type { FanConfig } from './fan_config';
import { readFanConfig } from './read_fan_config';
import { resolveNextFanDirection } from './resolve_next_fan_direction';
import { resolveNextFanRate } from './resolve_next_fan_rate';

/**
 * Key for the fan of the air conditioner. The rate key shows the displayed rate and goes to the next one on each press
 * (several presses in a row make one write); the swing key switches the swing on and off.
 */
export class FanKeyAction extends ClimateKeyAction<FanConfig> {
	override readonly manifestId = 'com.sonny93.climate.fan';

	override async onKeyDown(
		ev: KeyDownEvent<ClimateActionSettings>
	): Promise<void> {
		await this.runChange(ev.action, (state, config) => {
			if (config.control === 'swing') {
				return this.hub.requestChange(
					{ fanDirection: resolveNextFanDirection(state.fanDirection) },
					ClimateTiming.toggleQuietMilliseconds
				);
			}
			return this.hub.requestChange(
				{ fanRate: resolveNextFanRate(state.fanRate) },
				ClimateTiming.fanRateQuietMilliseconds
			);
		});
	}

	protected override readConfig(rawSettings: unknown): FanConfig {
		return readFanConfig(rawSettings);
	}

	protected override describeKey(
		view: ClimateView,
		config: FanConfig,
		language: Language
	): KeyDescription {
		return describeFanKey(view, config, language);
	}
}
