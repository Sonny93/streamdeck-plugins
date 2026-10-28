/** Raised when an action targets the default device of a direction while Windows has none. */
export class AudioDeviceUnavailableError extends Error {
	readonly code = 'E_AUDIO_DEVICE_UNAVAILABLE';
	override readonly name = 'AudioDeviceUnavailableError';

	constructor() {
		super('There is no default audio device for this direction.');
	}
}
