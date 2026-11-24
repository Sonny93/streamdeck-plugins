import { describe, expect, it, vi } from 'vitest';

import { createPactlEventWatcher } from './create_pactl_event_watcher';
import type { SpawnPactlSubscribeOptions } from './spawn_pactl_subscribe_options';

const INITIAL_BACKOFF_MILLISECONDS = 1000;
const MAX_BACKOFF_MILLISECONDS = 4000;

function createWatcher() {
	const processes: Array<
		SpawnPactlSubscribeOptions & { kill: ReturnType<typeof vi.fn> }
	> = [];
	const restarts: Array<{
		run: () => void;
		delay: number;
		cancel: () => void;
	}> = [];
	const watcher = createPactlEventWatcher({
		spawnSubscribe: (spawnOptions) => {
			const kill = vi.fn();
			processes.push({ ...spawnOptions, kill });
			return kill;
		},
		schedule: (run, delay) => {
			const cancel = vi.fn();
			restarts.push({ run, delay, cancel });
			return cancel;
		},
		initialBackoffMilliseconds: INITIAL_BACKOFF_MILLISECONDS,
		maxBackoffMilliseconds: MAX_BACKOFF_MILLISECONDS,
	});
	return { watcher, processes, restarts };
}

describe('createPactlEventWatcher', () => {
	it('reports the device events and ignores the stream ones', () => {
		const { watcher, processes } = createWatcher();
		const onChange = vi.fn();
		watcher(onChange);

		processes[0]?.onLine("Event 'change' on sink-input #4");
		expect(onChange).not.toHaveBeenCalled();

		processes[0]?.onLine("Event 'change' on sink #66");
		expect(onChange).toHaveBeenCalledOnce();
	});

	it('starts again with a growing delay when the process ends, and reports a change after each restart', () => {
		const { watcher, processes, restarts } = createWatcher();
		const onChange = vi.fn();
		watcher(onChange);

		processes[0]?.onExit();
		expect(restarts[0]?.delay).toBe(INITIAL_BACKOFF_MILLISECONDS);
		restarts[0]?.run();
		expect(processes).toHaveLength(2);
		expect(onChange).toHaveBeenCalledOnce();

		processes[1]?.onExit();
		expect(restarts[1]?.delay).toBe(2 * INITIAL_BACKOFF_MILLISECONDS);
	});

	it('reports the lines its own filter accepts instead of the device ones', () => {
		const processes: SpawnPactlSubscribeOptions[] = [];
		const watcher = createPactlEventWatcher({
			spawnSubscribe: (spawnOptions) => {
				processes.push(spawnOptions);
				return vi.fn();
			},
			schedule: () => vi.fn(),
			initialBackoffMilliseconds: INITIAL_BACKOFF_MILLISECONDS,
			maxBackoffMilliseconds: MAX_BACKOFF_MILLISECONDS,
			isRelevant: (line) => line.includes('module'),
		});
		const onChange = vi.fn();
		watcher(onChange);

		processes[0]?.onLine("Event 'change' on sink #66");
		expect(onChange).not.toHaveBeenCalled();

		processes[0]?.onLine("Event 'new' on module #7");
		expect(onChange).toHaveBeenCalledOnce();
	});

	it('goes back to the first delay once the process printed something', () => {
		const { watcher, processes, restarts } = createWatcher();
		watcher(vi.fn());
		processes[0]?.onExit();
		restarts[0]?.run();

		processes[1]?.onLine("Event 'change' on sink #1");
		processes[1]?.onExit();

		expect(restarts[1]?.delay).toBe(INITIAL_BACKOFF_MILLISECONDS);
	});

	it('kills the process and cancels the restart when it is stopped', () => {
		const { watcher, processes, restarts } = createWatcher();
		const stop = watcher(vi.fn());
		stop();
		expect(processes[0]?.kill).toHaveBeenCalledOnce();

		processes[0]?.onExit();
		expect(restarts).toHaveLength(0);
	});

	it('cancels a restart that waits when it is stopped', () => {
		const { watcher, processes, restarts } = createWatcher();
		const stop = watcher(vi.fn());
		processes[0]?.onExit();

		stop();

		expect(restarts[0]?.cancel).toHaveBeenCalledOnce();
	});
});
