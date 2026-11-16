/** Raised when a device id is not in the current listing of the system audio. */
export class AudioDeviceNotFoundError extends Error {
	readonly code = 'E_AUDIO_DEVICE_NOT_FOUND';
	override readonly name = 'AudioDeviceNotFoundError';

	constructor(deviceId: string) {
		super(`The audio device "${deviceId}" is not available.`);
	}
}
