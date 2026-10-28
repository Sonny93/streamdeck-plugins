import { wrapIndex } from './wrap_index';
import { CarouselTiming } from './carousel_timing';
import type { CarouselAnimatorOptions } from './carousel_animator_options';

/**
 * Drives the scroll position of one dial's carousel.
 * The position is a float and the target an integer, both unbounded so that wrapping around the list scrolls continuously.
 * While the position is away from the target, a frame is rendered every frame interval and the position closes on the target with an exponential ease.
 * A frame that is still being sent when the next tick comes makes that tick skip: frames are never queued.
 */
export class CarouselAnimator {
	private position = 0;
	private target = 0;
	private revision = 0;
	private running = false;
	private disposed = false;
	private frameInFlight = false;
	private cancelTick: (() => void) | undefined;

	constructor(private readonly options: CarouselAnimatorOptions) {}

	/** The current, possibly fractional, scroll position. */
	get currentPosition(): number {
		return this.position;
	}

	/** Whether the position is still moving towards its target. */
	get isAnimating(): boolean {
		return this.running;
	}

	/** Moves the target by a number of ticks and starts the frame loop when it is idle. */
	retarget(ticks: number): void {
		if (this.disposed) {
			return;
		}
		this.revision += 1;
		this.target += ticks;
		if (!this.running) {
			this.running = true;
			this.scheduleTick();
		}
	}

	/** Puts the position and the target on an index at once, without animation, and stops any scroll in progress. */
	jumpTo(index: number): void {
		this.stop();
		this.position = index;
		this.target = index;
	}

	/** The index of the target in a list of `length` items; presses and taps act on it, not on the in-flight position. */
	settledIndex(length: number): number {
		return wrapIndex({ index: this.target, length });
	}

	/** Stops the frame loop for good. */
	dispose(): void {
		this.disposed = true;
		this.stop();
	}

	private stop(): void {
		this.revision += 1;
		this.running = false;
		this.cancelTick?.();
		this.cancelTick = undefined;
	}

	private scheduleTick(): void {
		this.cancelTick = this.options.schedule(() => {
			void this.tick().catch(this.options.onError);
		}, CarouselTiming.frameIntervalMilliseconds);
	}

	private async tick(): Promise<void> {
		this.cancelTick = undefined;
		if (this.disposed) {
			return;
		}
		if (this.frameInFlight) {
			this.scheduleTick();
			return;
		}
		const distance = this.target - this.position;
		const settled = Math.abs(distance) < CarouselTiming.snapDistance;
		this.position = settled
			? this.target
			: this.position + distance * CarouselTiming.easeFactor;
		const { revision } = this;
		if (settled) {
			this.running = false;
		} else {
			this.scheduleTick();
		}
		await this.sendFrame();
		if (settled && revision === this.revision) {
			this.options.onSettled(this.target);
		}
	}

	private async sendFrame(): Promise<void> {
		this.frameInFlight = true;
		try {
			await this.options.onFrame(this.position);
		} catch (error) {
			this.options.onError(error);
		} finally {
			this.frameInFlight = false;
		}
	}
}
