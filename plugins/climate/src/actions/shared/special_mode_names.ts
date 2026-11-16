import type { SpecialMode } from '../../daikin/unit_types';

/** How the special modes of the unit are named on the keys and the strips. */
export const SpecialModeNames: Readonly<Record<SpecialMode, string>> = {
	powerful: 'Puissant',
	econo: 'Éco',
	streamer: 'Streamer',
};
