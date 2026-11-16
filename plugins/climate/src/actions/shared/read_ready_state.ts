import type { ClimateView } from '../../climate/climate_view';
import type { UnitState } from '../../daikin/unit_types';

/** The state to show, `undefined` while the unit is not ready: no address, not read yet, or no answer. */
export function readReadyState(view: ClimateView): UnitState | undefined {
	return view.status === 'ready' ? view.state : undefined;
}
