import { ListenTiming } from './listen_timing';

const DECIMALS = 4;

/** Rounds a level to the grid of the dial steps, without float noise (0.085, not 0.08500000001). */
export function roundListenLevel(level: number): number {
	const steps = Math.round(level / ListenTiming.levelStep);
	return Number((steps * ListenTiming.levelStep).toFixed(DECIMALS));
}
