import type { Scheduler } from '../async/scheduler';
import type { WakeGesture } from './wake_gesture';

export type WakeGateOptions = Readonly<{
	schedule: Scheduler;
	quietMilliseconds: number;
}>;

/**
 * Decides which dial events are swallowed because they only wake an idle panel.
 * From the event that woke the panel, every event is swallowed until the dials were left alone for the quiet period,
 * each swallowed event restarting it: a gesture that goes on is never applied, however long it lasts.
 * A push down that was swallowed also swallows its push up, even after the quiet period, so a press is never half applied.
 */
export class WakeGate {
	private cancelQuiet: (() => void) | undefined;
	private hasSwallowedPress = false;

	constructor(private readonly options: WakeGateOptions) {}

	/** Tells whether an event must be swallowed; `isPanelShowing` is whether the panel showed when the event came. */
	swallow(gesture: WakeGesture, isPanelShowing: boolean): boolean {
		const isInQuietPeriod = this.cancelQuiet !== undefined;
		const isEndOfSwallowedPress =
			gesture === 'release' && this.hasSwallowedPress;
		if (!isPanelShowing && !isInQuietPeriod && !isEndOfSwallowedPress) {
			this.hasSwallowedPress = false;
			return false;
		}
		this.hasSwallowedPress =
			gesture === 'press' || (this.hasSwallowedPress && gesture !== 'release');
		this.restartQuietPeriod();
		return true;
	}

	private restartQuietPeriod(): void {
		this.cancelQuiet?.();
		this.cancelQuiet = this.options.schedule(() => {
			this.cancelQuiet = undefined;
		}, this.options.quietMilliseconds);
	}
}
