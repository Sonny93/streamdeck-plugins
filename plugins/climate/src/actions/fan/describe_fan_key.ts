import type { Language } from 'deck-kit/i18n/language';

import type { ClimateView } from '../../climate/climate_view';
import { climateMessages } from '../../i18n/climate_messages';
import { fanGlyph } from '../keys/fan_glyph';
import type { KeyDescription } from '../keys/key_description';
import { KeyState } from '../keys/key_state';
import { swingGlyph } from '../keys/swing_glyph';
import { getFanRateName } from '../shared/fan_rate_name';
import { readReadyState } from '../shared/read_ready_state';
import type { FanConfig } from './fan_config';

/**
 * A "Fan" key. The rate key shows the displayed fan rate and is lit while the unit is on;
 * the swing key is lit while the unit swings in any direction. Both are dimmed while the unit is not ready.
 */
export function describeFanKey(
	view: ClimateView,
	config: FanConfig,
	language: Language
): KeyDescription {
	const state = readReadyState(view);
	const glyph = config.control === 'swing' ? swingGlyph : fanGlyph;
	if (state === undefined) {
		return { state: KeyState.unavailable, glyph, label: undefined };
	}
	if (config.control === 'swing') {
		return {
			state: state.fanDirection === 'fixed' ? KeyState.off : KeyState.on,
			glyph,
			label: {
				text: climateMessages.text('swingOn', language),
				position: 'top',
			},
		};
	}
	return {
		state: state.isPowered ? KeyState.on : KeyState.off,
		glyph,
		label: { text: getFanRateName(state.fanRate, language), position: 'top' },
	};
}
