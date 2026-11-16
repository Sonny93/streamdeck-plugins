/** Raised when the Elgato audio server is asked to restart on a system that has none. */
export class ElgatoAudioUnsupportedError extends Error {
	readonly code = 'E_ELGATO_AUDIO_UNSUPPORTED';
	override readonly name = 'ElgatoAudioUnsupportedError';

	constructor() {
		super('The Elgato audio server does not exist on this system.');
	}
}
