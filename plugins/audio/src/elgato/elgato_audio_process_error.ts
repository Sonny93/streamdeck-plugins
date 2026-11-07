/** Raised when Windows cannot list or kill the Elgato audio server process. */
export class ElgatoAudioProcessError extends Error {
	readonly code = 'E_ELGATO_AUDIO_PROCESS';
	override readonly name = 'ElgatoAudioProcessError';

	constructor(action: 'list' | 'kill', cause: unknown) {
		super(`Cannot ${action} the Elgato audio server process.`, { cause });
	}
}
