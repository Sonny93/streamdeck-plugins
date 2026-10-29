import type { Scheduler } from 'deck-kit/async/scheduler';
import { describe, expect, it, vi } from 'vitest';

import { CarouselAnimator } from './carousel_animator';

const MAX_TICKS = 200;

type ScheduledTick = { callback: () => void; cancelled: boolean };

function flushPromises(): Promise<void> {
	return new Promise((resolve) => {
		setImmediate(resolve);
	});
}

function buildAnimator(
	onFrame: (position: number) => Promise<void> = () => Promise.resolve()
) {
	const queue: ScheduledTick[] = [];
	const schedule: Scheduler = (callback) => {
		const entry: ScheduledTick = { callback, cancelled: false };
		queue.push(entry);
		return () => {
			entry.cancelled = true;
		};
	};
	const frames: number[] = [];
	const onFrameSpy = vi.fn((position: number) => {
		frames.push(position);
		return onFrame(position);
	});
	const onSettled = vi.fn();
	const onError = vi.fn();
	const animator = new CarouselAnimator({
		schedule,
		onFrame: onFrameSpy,
		onSettled,
		onError,
	});
	async function tick(): Promise<void> {
		const entry = queue.shift();
		if (entry !== undefined && !entry.cancelled) {
			entry.callback();
		}
		await flushPromises();
	}
	async function runUntilIdle(): Promise<void> {
		for (let count = 0; count < MAX_TICKS && queue.length > 0; count += 1) {
			await tick();
		}
	}
	return {
		animator,
		frames,
		onFrameSpy,
		onSettled,
		onError,
		tick,
		runUntilIdle,
	};
}

describe('CarouselAnimator', () => {
	it('should converge on the target and settle on it', async () => {
		const { animator, frames, onSettled, runUntilIdle } = buildAnimator();

		animator.retarget(3);
		await runUntilIdle();

		expect(frames.at(-1)).toBe(3);
		expect(onSettled).toHaveBeenCalledExactlyOnceWith(3);
	});

	it('should move closer to the target at every frame', async () => {
		const { animator, frames, runUntilIdle } = buildAnimator();

		animator.retarget(2);
		await runUntilIdle();

		const increasing = frames.every(
			(position, index) => index === 0 || position > (frames[index - 1] ?? 0)
		);
		expect(increasing).toBe(true);
	});

	it('should not render a frame before the first tick', () => {
		const { animator, onFrameSpy } = buildAnimator();

		animator.retarget(1);

		expect(onFrameSpy).not.toHaveBeenCalled();
	});

	it('should continue from the current position when retargeted mid-flight', async () => {
		const { animator, frames, tick, runUntilIdle, onSettled } = buildAnimator();
		animator.retarget(4);
		await tick();
		await tick();
		const midFlight = frames.at(-1) ?? 0;

		animator.retarget(-2);
		await runUntilIdle();

		expect(frames[2]).toBeLessThan(4);
		expect(frames[2]).toBeGreaterThan(midFlight - 1);
		expect(frames.at(-1)).toBe(2);
		expect(onSettled).toHaveBeenCalledExactlyOnceWith(2);
	});

	it('should not settle for a scroll that was retargeted before it ended', async () => {
		const { animator, tick, onSettled } = buildAnimator();
		animator.retarget(1);

		await tick();
		animator.retarget(1);

		expect(onSettled).not.toHaveBeenCalled();
	});

	it('should wrap the settled index of a negative target', () => {
		const { animator } = buildAnimator();

		animator.retarget(-1);

		expect(animator.settledIndex(5)).toBe(4);
	});

	it('should wrap the settled index of a target beyond the end', () => {
		const { animator } = buildAnimator();
		animator.jumpTo(3);

		animator.retarget(4);

		expect(animator.settledIndex(5)).toBe(2);
	});

	it('should report the target as settled index while the position is in flight', async () => {
		const { animator, tick } = buildAnimator();
		animator.retarget(3);

		await tick();

		expect(animator.settledIndex(10)).toBe(3);
	});

	it('should skip the ticks that come while a frame is being sent', async () => {
		let release: () => void = () => undefined;
		const pending = new Promise<void>((resolve) => {
			release = resolve;
		});
		const { animator, onFrameSpy, tick } = buildAnimator(() => pending);
		animator.retarget(5);

		await tick();
		await tick();
		await tick();

		expect(onFrameSpy).toHaveBeenCalledTimes(1);

		release();
		await flushPromises();
		await tick();

		expect(onFrameSpy).toHaveBeenCalledTimes(2);
	});

	it('should not advance the position on a skipped tick', async () => {
		let release: () => void = () => undefined;
		const pending = new Promise<void>((resolve) => {
			release = resolve;
		});
		const { animator, tick } = buildAnimator(() => pending);
		animator.retarget(5);
		await tick();
		const positionAfterFirstFrame = animator.currentPosition;

		await tick();

		expect(animator.currentPosition).toBe(positionAfterFirstFrame);
		release();
	});

	it('should jump without animation and without frame', async () => {
		const { animator, onFrameSpy, onSettled, tick } = buildAnimator();

		animator.jumpTo(7);
		await tick();

		expect(animator.currentPosition).toBe(7);
		expect(animator.settledIndex(10)).toBe(7);
		expect(animator.isAnimating).toBe(false);
		expect(onFrameSpy).not.toHaveBeenCalled();
		expect(onSettled).not.toHaveBeenCalled();
	});

	it('should stop a scroll in progress when it jumps', async () => {
		const { animator, onFrameSpy, tick } = buildAnimator();
		animator.retarget(5);

		animator.jumpTo(1);
		await tick();

		expect(onFrameSpy).not.toHaveBeenCalled();
		expect(animator.currentPosition).toBe(1);
	});

	it('should report that it is animating until it settles', async () => {
		const { animator, runUntilIdle } = buildAnimator();

		animator.retarget(1);
		expect(animator.isAnimating).toBe(true);

		await runUntilIdle();
		expect(animator.isAnimating).toBe(false);
	});

	it('should stop rendering frames once disposed', async () => {
		const { animator, onFrameSpy, tick } = buildAnimator();
		animator.retarget(5);
		await tick();

		animator.dispose();
		await tick();
		await tick();

		expect(onFrameSpy).toHaveBeenCalledTimes(1);
	});

	it('should ignore a retarget once disposed', async () => {
		const { animator, onFrameSpy, tick } = buildAnimator();
		animator.dispose();

		animator.retarget(2);
		await tick();

		expect(onFrameSpy).not.toHaveBeenCalled();
	});

	it('should report the error of a failing frame and keep going', async () => {
		const error = new Error('send failed');
		const { animator, onError, runUntilIdle, onSettled } = buildAnimator(() =>
			Promise.reject(error)
		);

		animator.retarget(1);
		await runUntilIdle();

		expect(onError).toHaveBeenCalledWith(error);
		expect(onSettled).toHaveBeenCalledExactlyOnceWith(1);
	});
});
