/** Raised when `pactl` lists something that is not a list of devices or a server description. */
export class PactlListingError extends Error {
	readonly code = 'E_PACTL_LISTING';
	override readonly name = 'PactlListingError';

	constructor(what: string) {
		super(`pactl printed an unexpected ${what}.`);
	}
}
