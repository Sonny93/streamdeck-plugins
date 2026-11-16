import type { KeyDownEvent } from '@elgato/streamdeck';
import type { Language } from 'deck-kit/i18n/language';

import type { ClimateView } from '../../climate/climate_view';
import type { KeyDescription } from '../keys/key_description';
import type { ClimateActionSettings } from '../shared/climate_action_settings';
import { ClimateKeyAction } from '../shared/climate_key_action';
import { describeSpecialModeKey } from './describe_special_mode_key';
import { readSpecialModeConfig } from './read_special_mode_config';
import { resolveSpecialModeTarget } from './resolve_special_mode_target';
import type { SpecialModeConfig } from './special_mode_config';

/**
 * Key that switches the powerful or the econo mode of the air conditioner, lit while the mode is active.
 * It does nothing but show an alert while the unit is off.
 */
export class SpecialModeKeyAction extends ClimateKeyAction<SpecialModeConfig> {
	override readonly manifestId = 'com.sonny93.climate.special-mode';

	override async onKeyDown(
		ev: KeyDownEvent<ClimateActionSettings>
	): Promise<void> {
		await this.runChange(ev.action, async (state, config) => {
			const isActive = resolveSpecialModeTarget(state, config.mode);
			if (isActive === undefined) {
				await this.showAlertSafely(ev.action);
				return;
			}
			await this.hub.requestSpecialMode(config.mode, isActive);
		});
	}

	protected override readConfig(rawSettings: unknown): SpecialModeConfig {
		return readSpecialModeConfig(rawSettings);
	}

	protected override describeKey(
		view: ClimateView,
		config: SpecialModeConfig,
		language: Language
	): KeyDescription {
		return describeSpecialModeKey(view, config, language);
	}
}
