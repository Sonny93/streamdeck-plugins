/** Access to the Elgato audio server process, injected so the restart logic runs without spawning anything. */
export type ElgatoAudioServerProcess = Readonly<{
	isRunning: () => Promise<boolean>;
	kill: () => Promise<void>;
}>;
