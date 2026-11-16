import type {
	SensorReading,
	UnitEnergy,
	UnitState,
} from '../daikin/unit_types';
import type { ClimateStatus } from './climate_status';

/**
 * What the actions draw. `state` is the last state read with the changes not written yet applied on top,
 * and it is kept while the unit is unreachable.
 */
export type ClimateView = Readonly<{
	status: ClimateStatus;
	sensors: SensorReading | undefined;
	state: UnitState | undefined;
	/** Energy used by the unit, `undefined` until the first read. */
	energy: UnitEnergy | undefined;
}>;
