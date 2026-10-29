import type { MonitorSnapshot } from './monitor_snapshot';

/** State of every monitor, the primary one first. */
export type DisplaySnapshot = Readonly<{
	monitors: readonly MonitorSnapshot[];
}>;
