/** Timing of the restart of the Elgato audio server. */
export const ElgatoAudioTiming = {
	/** Delay between two looks at the process list while waiting for the server to come back. */
	pollIntervalMilliseconds: 500,
	/** How long the server may take to come back before the restart is a failure. */
	restartTimeoutMilliseconds: 15_000,
	/** How long a Windows tool may run before it is given up on. */
	toolTimeoutMilliseconds: 10_000,
} as const;
