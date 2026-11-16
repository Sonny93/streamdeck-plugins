import type { KeyDownEvent } from '@elgato/streamdeck';
import type { Language } from 'deck-kit/i18n/language';
import type { KeyAppearance } from 'deck-kit/keys/key_appearance';

import type { MonitorSnapshot } from '../../displays/monitor_snapshot';
import { displayMessages } from '../../i18n/display_messages';
import { KeyPalette } from '../keys/key_palette';
import { KeyState } from '../keys/key_state';
import type { KeyStateValue } from '../keys/key_state_value';
import { screenGlyph } from '../keys/screen_glyph';
import { screenOffGlyph } from '../keys/screen_off_glyph';
import type { DisplayActionConfig } from './display_action_config';
import type { DisplayActionSettings } from './display_action_settings';
import { DisplayKeyAction } from './display_key_action';
import { resolveOffMode } from './resolve_off_mode';
import { resolveScreenPowerKeyState } from './resolve_screen_power_key_state';

const APPEARANCES: Readonly<Record<KeyStateValue, KeyAppearance>> = {
	[KeyState.off]: { glyph: screenOffGlyph, color: KeyPalette.idle },
	[KeyState.on]: { glyph: screenGlyph, color: KeyPalette.active },
	[KeyState.unavailable]: { glyph: screenGlyph, color: KeyPalette.unavailable },
};

/**
 * Key that turns its monitors off and on again, the main one unless others are picked.
 * By default it covers them with a black screen, which keeps the window layout where the system allows one; it can put them in standby over DDC/CI instead.
 */
export class ScreenPowerKeyAction extends DisplayKeyAction {
	override readonly manifestId = 'com.sonny93.display.power';

	protected override readonly offersAll = true;

	override async onKeyDown(
		ev: KeyDownEvent<DisplayActionSettings>
	): Promise<void> {
		await this.runChange(ev.action, (monitors, config) =>
			this.hub.toggleScreens(
				monitors.map((monitor) => monitor.id),
				resolveOffMode(config.offMode, monitors)
			)
		);
	}

	protected override defaultLabel(
		_config: DisplayActionConfig,
		language: Language
	): string {
		return displayMessages.text('screenKeyLabel', language);
	}

	protected override resolveKeyState(
		monitors: readonly MonitorSnapshot[],
		config: DisplayActionConfig
	): KeyStateValue {
		return resolveScreenPowerKeyState(monitors, config);
	}

	protected override appearanceOf(state: KeyStateValue): KeyAppearance {
		return APPEARANCES[state];
	}
}
