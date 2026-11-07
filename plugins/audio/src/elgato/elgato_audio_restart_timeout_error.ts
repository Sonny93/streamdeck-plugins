/** Raised when the Elgato audio server does not start again after it was killed. */
export class ElgatoAudioRestartTimeoutError extends Error {
	readonly code = 'E_ELGATO_AUDIO_RESTART_TIMEOUT';
	override readonly name = 'ElgatoAudioRestartTimeoutError';

	constructor(timeoutMilliseconds: number) {
		super(
			`The Elgato audio server did not start again within ${timeoutMilliseconds} ms.`
		);
	}
}
