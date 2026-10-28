import type { CarouselScheduler } from './carousel_scheduler';

type ProgressTickerOptions = Readonly<{
	schedule: CarouselScheduler;
	intervalMilliseconds: number;
	onTick: () => void;
}>;

/** Calls `onTick` at a fixed interval while running, so that a playback progress shown somewhere keeps moving. */
export class ProgressTicker {
	private cancel: (() => void) | undefined;

	constructor(private readonly options: ProgressTickerOptions) {}

	/** Cancels the pending tick, then keeps ticking only when `isRunning`. */
	restart(isRunning: boolean): void {
		this.stop();
		if (isRunning) {
			this.scheduleNext();
		}
	}

	/** Cancels the pending tick. */
	stop(): void {
		this.cancel?.();
		this.cancel = undefined;
	}

	private scheduleNext(): void {
		this.cancel = this.options.schedule(() => {
			this.scheduleNext();
			this.options.onTick();
		}, this.options.intervalMilliseconds);
	}
}
