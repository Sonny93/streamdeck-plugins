/** Levels and delays of listening, the levels going from 0 to 1 on the `pactl` percent scale (100 % is 1). */
export const ListenTiming = {
	/** Level a source starts at when nothing was remembered for it. */
	defaultLevel: 0.08,
	/** Level change of one dial tick. */
	levelStep: 0.005,
	/** Wait between two upward level steps, so a loud level is never reached in one jump. */
	upwardStepIntervalMilliseconds: 150,
	/** How far the live level of a source may be above the allowed one before the watchdog cuts it. */
	levelTolerance: 0.005,
	/** Highest level a loopback stream may show, 100 % on the `pactl` percent scale; above it the stream amplifies. */
	maximumStreamLevel: 1,
	/** Delay between two safety reads while something listens or a loopback is loaded; the change watcher reports most changes. */
	safetyPollIntervalMilliseconds: 2000,
	/** Wait after the last level change before the remembered levels are saved. */
	levelSaveDelayMilliseconds: 500,
	/** Default of the ceiling setting of the dial, in percent. */
	defaultMaximumLevelPercent: 20,
} as const;
