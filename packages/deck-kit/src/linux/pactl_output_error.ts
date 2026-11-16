/** Raised when pactl prints output that is not valid JSON. */
export class PactlOutputError extends Error {
	readonly code = 'E_PACTL_OUTPUT';
	override readonly name = 'PactlOutputError';

	constructor(options: Readonly<{ cause: unknown }>) {
		super('pactl printed output that is not valid JSON.', {
			cause: options.cause,
		});
	}
}
