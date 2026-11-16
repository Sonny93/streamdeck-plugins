import type { Language } from 'deck-kit/i18n/language';

import type { ClimateView } from '../../climate/climate_view';
import type { KeyDescription } from '../keys/key_description';
import { KeyState } from '../keys/key_state';
import { powerGlyph } from '../keys/power_glyph';
import { formatTemperature } from '../shared/format_temperature';
import { readReadyState } from '../shared/read_ready_state';

/** A "Power" key lit while the unit is on, with the room temperature as its label, dimmed while the unit is not ready. */
export function describePowerKey(
	view: ClimateView,
	language: Language
): KeyDescription {
	const state = readReadyState(view);
	if (state === undefined) {
		return { state: KeyState.unavailable, glyph: powerGlyph, label: undefined };
	}
	return {
		state: state.isPowered ? KeyState.on : KeyState.off,
		glyph: powerGlyph,
		label: {
			text: formatTemperature(view.sensors?.indoorTemperature, language),
			position: 'top',
		},
	};
}
