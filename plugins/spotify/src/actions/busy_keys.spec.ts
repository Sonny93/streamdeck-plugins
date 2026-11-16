import { describe, expect, it } from 'vitest';

import { BusyKeys } from './busy_keys';

function buildPendingTask() {
	let finish = (): void => undefined;
	const task = () =>
		new Promise<void>((resolve) => {
			finish = resolve;
		});
	return { task, finish: () => finish() };
}

describe('BusyKeys', () => {
	it('should be busy while a task runs', async () => {
		const busyKeys = new BusyKeys();
		const pending = buildPendingTask();

		const running = busyKeys.track('dial', pending.task);

		expect(busyKeys.isBusy('dial')).toBe(true);
		pending.finish();
		await running;
	});

	it('should be free once the task settles', async () => {
		const busyKeys = new BusyKeys();
		const pending = buildPendingTask();
		const running = busyKeys.track('dial', pending.task);

		pending.finish();
		await running;

		expect(busyKeys.isBusy('dial')).toBe(false);
	});

	it('should be free after a task fails', async () => {
		const busyKeys = new BusyKeys();

		await busyKeys
			.track('dial', () => Promise.reject(new Error('boom')))
			.catch(() => undefined);

		expect(busyKeys.isBusy('dial')).toBe(false);
	});

	it('should stay busy until every overlapping task settles', async () => {
		const busyKeys = new BusyKeys();
		const first = buildPendingTask();
		const second = buildPendingTask();
		const firstRunning = busyKeys.track('dial', first.task);
		const secondRunning = busyKeys.track('dial', second.task);

		first.finish();
		await firstRunning;

		expect(busyKeys.isBusy('dial')).toBe(true);
		second.finish();
		await secondRunning;
	});

	it('should not mix up two keys', async () => {
		const busyKeys = new BusyKeys();
		const pending = buildPendingTask();

		const running = busyKeys.track('first', pending.task);

		expect(busyKeys.isBusy('second')).toBe(false);
		pending.finish();
		await running;
	});
});
