/**
 * Raised when a button change is asked before the Volt 1 reported its state.
 * A settings report rewrites every button, so sending one blind could switch phantom power.
 */
export class VoltStateUnknownError extends Error {
	readonly code = 'E_VOLT_STATE_UNKNOWN';
	override readonly name = 'VoltStateUnknownError';

	constructor() {
		super(
			'The Volt 1 has not reported its state yet; it does when it plays sound or a button is pressed.'
		);
	}
}
