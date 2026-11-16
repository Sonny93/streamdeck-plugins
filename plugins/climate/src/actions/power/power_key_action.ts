import type { KeyDownEvent } from '@elgato/streamdeck';
import type { Language } from 'deck-kit/i18n/language';

import { ClimateTiming } from '../../climate/climate_timing';
import type { ClimateView } from '../../climate/climate_view';
import type { KeyDescription } from '../keys/key_description';
import type { ClimateActionSettings } from '../shared/climate_action_settings';
import { ClimateKeyAction } from '../shared/climate_key_action';
import { describePowerKey } from './describe_power_key';

/** Key that turns the air conditioner on or off, lit while it is on, with the room temperature as its label. */
export class PowerKeyAction extends ClimateKeyAction<undefined> {
	override readonly manifestId = 'com.sonny93.climate.power';

	override async onKeyDown(
		ev: KeyDownEvent<ClimateActionSettings>
	): Promise<void> {
		await this.runChange(ev.action, (state) =>
			this.hub.requestChange(
				{ isPowered: !state.isPowered },
				ClimateTiming.toggleQuietMilliseconds
			)
		);
	}

	protected override readConfig(): undefined {
		return undefined;
	}

	protected override describeKey(
		view: ClimateView,
		_config: undefined,
		language: Language
	): KeyDescription {
		return describePowerKey(view, language);
	}
}
