/** Values of the listening safety checks and of the loopback it loads. */
export const ListenSettings = {
	/** Latency the user runs their loopback with. */
	loopbackLatencyMilliseconds: 1,
	/** Number of reads to see a volume applied or a stream appear. */
	readBackAttempts: 5,
	readBackDelayMilliseconds: 60,
	/** Margin over the requested level a channel may show, for the rounding of the percent. */
	levelTolerance: 0.005,
	/** Level of a stream above which a loopback is unloaded, 1 being 100 %. */
	maxStreamLevel: 1,
	/** Property the plugin puts on the capture stream of its loopbacks, so it can tell them from the ones the user loaded. */
	loopbackTag: 'sonny93.listen=true',
	/** Timeout of every `pactl` call, so a stuck server does not hold a read or a safety check. */
	commandTimeoutMilliseconds: 1500,
	/** Timeout of one synchronous unload at the exit of the process. */
	exitUnloadTimeoutMilliseconds: 1000,
} as const;
