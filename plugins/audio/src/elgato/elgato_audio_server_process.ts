/** Access to the Elgato audio server process, injected so the restart logic runs without spawning anything. */
export type ElgatoAudioServerProcess = Readonly<{
	/** `false` on a system without the Elgato audio server, where the restart key is unavailable. */
	isSupported: boolean;
	isRunning: () => Promise<boolean>;
	kill: () => Promise<void>;
}>;
