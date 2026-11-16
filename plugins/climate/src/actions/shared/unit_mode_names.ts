import type { UnitMode } from '../../daikin/unit_types';

/** How the modes of the unit are named on the keys and the strip. */
export const UnitModeNames: Readonly<Record<UnitMode, string>> = {
	auto: 'Auto',
	dry: 'Déshu.',
	cool: 'Froid',
	heat: 'Chaud',
	fan: 'Ventil.',
};
