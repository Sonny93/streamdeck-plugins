import type { KeyDownEvent } from '@elgato/streamdeck';
import type { Language } from 'deck-kit/i18n/language';

import { ClimateTiming } from '../../climate/climate_timing';
import type { ClimateView } from '../../climate/climate_view';
import type { KeyDescription } from '../keys/key_description';
import { KeyState } from '../keys/key_state';
import type { ClimateActionSettings } from '../shared/climate_action_settings';
import { ClimateKeyAction } from '../shared/climate_key_action';
import { buildPresetPatch } from './build_preset_patch';
import { describePresetKey } from './describe_preset_key';
import type { PresetConfig } from './preset_config';
import { readPresetConfig } from './read_preset_config';

/**
 * Key that puts the air conditioner in a preset: a mode, a temperature and a fan rate, each optional.
 * With a mode it turns the unit on in it; without one it sets the temperature and the fan rate of the current mode.
 * It lights up while the unit matches the preset, and dims when its settings cannot be applied.
 */
export class PresetKeyAction extends ClimateKeyAction<PresetConfig> {
	override readonly manifestId = 'com.sonny93.climate.preset';

	override async onKeyDown(
		ev: KeyDownEvent<ClimateActionSettings>
	): Promise<void> {
		await this.runChange(ev.action, async (_state, config) => {
			if (
				config.kind === 'invalid' ||
				this.describeKey(this.hub.view, config, this.languageStore.current)
					.state === KeyState.unavailable
			) {
				await this.showAlertSafely(ev.action);
				return;
			}
			await this.hub.requestChange(
				buildPresetPatch(config),
				ClimateTiming.toggleQuietMilliseconds
			);
		});
	}

	protected override readConfig(rawSettings: unknown): PresetConfig {
		return readPresetConfig(rawSettings);
	}

	protected override describeKey(
		view: ClimateView,
		config: PresetConfig,
		language: Language
	): KeyDescription {
		return describePresetKey(view, config, language);
	}
}
