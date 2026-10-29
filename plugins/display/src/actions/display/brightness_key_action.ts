import type { KeyDownEvent } from '@elgato/streamdeck';
import type { KeyAppearance } from 'deck-kit/keys/key_appearance';

import type { MonitorSnapshot } from '../../displays/monitor_snapshot';
import type { KeyStateValue } from '../keys/key_state_value';
import { sunGlyph } from '../keys/sun_glyph';
import { toggleKeyAppearance } from '../keys/toggle_key_appearance';
import { changeMonitorsBrightness } from './change_monitors_brightness';
import { defaultBrightnessKeyLabel } from './default_brightness_key_label';
import type { DisplayActionConfig } from './display_action_config';
import type { DisplayActionSettings } from './display_action_settings';
import { DisplayKeyAction } from './display_key_action';
import { resolveBrightnessKeyState } from './resolve_brightness_key_state';

/**
 * Key that sets the brightness of its monitors to a value, or moves it up or down by a step; the main monitor unless others are picked.
 * A key that sets a value lights up while its monitors are at it.
 */
export class BrightnessKeyAction extends DisplayKeyAction {
	override readonly manifestId = 'com.sonny93.display.brightness-key';

	protected override readonly offersAll = true;

	override async onKeyDown(
		ev: KeyDownEvent<DisplayActionSettings>
	): Promise<void> {
		await this.runChange(ev.action, (monitors, config) =>
			changeMonitorsBrightness(
				monitors,
				config.brightnessControl,
				(monitorId, source) => {
					switch (config.brightnessKeyMode) {
						case 'set':
							return this.hub.setBrightness(monitorId, source, config.value);
						case 'up':
							return this.hub.changeBrightness(monitorId, source, config.step);
						case 'down':
							return this.hub.changeBrightness(monitorId, source, -config.step);
					}
				}
			)
		);
	}

	protected override defaultLabel(config: DisplayActionConfig): string {
		return defaultBrightnessKeyLabel(config);
	}

	protected override resolveKeyState(
		monitors: readonly MonitorSnapshot[],
		config: DisplayActionConfig
	): KeyStateValue {
		return resolveBrightnessKeyState(monitors, config);
	}

	protected override appearanceOf(state: KeyStateValue): KeyAppearance {
		return toggleKeyAppearance(sunGlyph, state);
	}
}
