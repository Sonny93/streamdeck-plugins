import type { InactivityMonitor } from '../async/inactivity_monitor';
import type { Scheduler } from '../async/scheduler';

/**
 * What an idle panel reads from its plugin:
 * the inactivity of the dials and the scheduler that measures the quiet period of a wake; whether there is something to show now; how to hear that what is shown changed;
 * the SVG of the slice a column draws; how to turn that SVG into the image sent to the dial (the SVG data URL by default,
 * `undefined` to keep the image already shown); the key of the pixmap item of the dial layout (`canvas` by default); and who to tell about failures.
 */
export type IdlePanelOptions = Readonly<{
	inactivity: Pick<
		InactivityMonitor,
		'isInactive' | 'subscribe' | 'recordActivity'
	>;
	schedule: Scheduler;
	/** How long the dials must be left alone after a gesture that woke the panel; `IdleTiming.wakeQuietMilliseconds` by default. */
	wakeQuietMilliseconds?: number;
	isAvailable: () => boolean;
	subscribe: (listener: () => void) => () => void;
	buildSlice: (column: number) => string;
	encodeSlice?: (svg: string) => Promise<string | undefined>;
	feedbackKey?: string;
	onError: (error: unknown) => void;
}>;
