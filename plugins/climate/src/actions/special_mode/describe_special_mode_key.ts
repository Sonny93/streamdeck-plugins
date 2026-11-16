import type { Language } from 'deck-kit/i18n/language';

import type { ClimateView } from '../../climate/climate_view';
import { econoGlyph } from '../keys/econo_glyph';
import type { KeyDescription } from '../keys/key_description';
import { KeyState } from '../keys/key_state';
import { powerfulGlyph } from '../keys/powerful_glyph';
import { readReadyState } from '../shared/read_ready_state';
import { resolveKeyLabel } from '../shared/resolve_key_label';
import { getSpecialModeName } from '../shared/special_mode_name';
import type { SpecialModeConfig } from './special_mode_config';

/** A "Special mode" key lit while the unit is on with that mode active, dimmed while the unit is not ready. Its default label is the name of the mode in `language`. */
export function describeSpecialModeKey(
	view: ClimateView,
	config: SpecialModeConfig,
	language: Language
): KeyDescription {
	const glyph = config.mode === 'econo' ? econoGlyph : powerfulGlyph;
	const state = readReadyState(view);
	if (state === undefined) {
		return { state: KeyState.unavailable, glyph, label: undefined };
	}
	const isActive = state.isPowered && state.specialModes.includes(config.mode);
	return {
		state: isActive ? KeyState.on : KeyState.off,
		glyph,
		label: resolveKeyLabel(
			config.label,
			getSpecialModeName(config.mode, language)
		),
	};
}
