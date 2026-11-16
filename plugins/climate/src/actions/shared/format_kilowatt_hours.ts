const NO_ENERGY = '–';

/** Formats an energy in kWh with one decimal and a French comma, a dash when there is none. */
export function formatKilowattHours(kilowattHours: number | undefined): string {
	return kilowattHours === undefined
		? NO_ENERGY
		: kilowattHours.toFixed(1).replace('.', ',');
}
