import type { ClimateView } from '../../climate/climate_view';
import { readReadyState } from '../shared/read_ready_state';
import type { StripTone } from './strip_tone';

/** The tone of the strips for what the unit does: its mode while it is on, neutral while it is off or not ready. */
export function resolveStripTone(view: ClimateView): StripTone {
	const state = readReadyState(view);
	if (state === undefined || !state.isPowered) {
		return 'neutral';
	}
	if (state.mode === 'heat' || state.mode === 'cool') {
		return state.mode;
	}
	return 'teal';
}
