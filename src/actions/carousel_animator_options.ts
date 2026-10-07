import type { CarouselScheduler } from './carousel_scheduler';

/**
 * What a `CarouselAnimator` needs: the scheduler, the frame renderer, and the callbacks.
 * `onSettled` receives the unbounded integer target the scroll stopped on.
 */
export type CarouselAnimatorOptions = Readonly<{
	schedule: CarouselScheduler;
	onFrame: (position: number) => Promise<void>;
	onSettled: (target: number) => void;
	onError: (error: unknown) => void;
}>;
