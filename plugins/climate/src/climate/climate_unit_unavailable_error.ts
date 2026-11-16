/** A change cannot reach the unit: there is no address, or the address changed before the change was written. */
export class ClimateUnitUnavailableError extends Error {
	readonly code = 'E_CLIMATE_UNIT_UNAVAILABLE';

	constructor(message: string) {
		super(message);
		this.name = new.target.name;
	}
}
