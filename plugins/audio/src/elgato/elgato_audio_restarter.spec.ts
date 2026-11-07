import { describe, expect, it, vi } from 'vitest';

import { ElgatoAudioProcessError } from './elgato_audio_process_error';
import { ElgatoAudioRestartTimeoutError } from './elgato_audio_restart_timeout_error';
import { ElgatoAudioRestarter } from './elgato_audio_restarter';

const POLL_INTERVAL_MILLISECONDS = 500;
const RESTART_TIMEOUT_MILLISECONDS = 2000;

function flushPromises(): Promise<void> {
	return new Promise((resolve) => {
		setImmediate(resolve);
	});
}

function createRestarter(runningStates: readonly boolean[]) {
	const remainingStates = [...runningStates];
	const calls: string[] = [];
	const delays: number[] = [];
	let pendingCallback: (() => void) | undefined;
	const serverProcess = {
		isRunning: vi.fn(() => {
			calls.push('isRunning');
			return Promise.resolve(remainingStates.shift() ?? false);
		}),
		kill: vi.fn(() => {
			calls.push('kill');
			return Promise.resolve();
		}),
	};
	const restarter = new ElgatoAudioRestarter({
		serverProcess,
		schedule: (callback, delayMilliseconds) => {
			delays.push(delayMilliseconds);
			pendingCallback = callback;
			return () => undefined;
		},
		pollIntervalMilliseconds: POLL_INTERVAL_MILLISECONDS,
		restartTimeoutMilliseconds: RESTART_TIMEOUT_MILLISECONDS,
	});

	async function elapse(): Promise<void> {
		await flushPromises();
		const callback = pendingCallback;
		pendingCallback = undefined;
		callback?.();
		await flushPromises();
	}

	return { restarter, serverProcess, calls, delays, elapse };
}

describe('ElgatoAudioRestarter', () => {
	it('should kill the running server and finish once it is back', async () => {
		const { restarter, calls, elapse } = createRestarter([true, false, true]);

		const outcome = restarter.restart();
		await elapse();
		await elapse();

		await expect(outcome).resolves.toBe('restarted');
		expect(calls).toEqual(['isRunning', 'kill', 'isRunning', 'isRunning']);
	});

	it('should skip the kill and wait when the server is not running', async () => {
		const { restarter, serverProcess, elapse } = createRestarter([
			false,
			false,
			true,
		]);

		const outcome = restarter.restart();
		await elapse();
		await elapse();

		await expect(outcome).resolves.toBe('restarted');
		expect(serverProcess.kill).not.toHaveBeenCalled();
	});

	it('should wait one poll interval between two looks at the process', async () => {
		const { restarter, delays, elapse } = createRestarter([true, false, true]);

		const outcome = restarter.restart();
		await elapse();
		await elapse();
		await outcome;

		expect(delays).toEqual([
			POLL_INTERVAL_MILLISECONDS,
			POLL_INTERVAL_MILLISECONDS,
		]);
	});

	it('should fail with a timeout when the server never comes back', async () => {
		const { restarter, delays, elapse } = createRestarter([true]);

		const outcome = restarter.restart();
		const failure = expect(outcome).rejects.toBeInstanceOf(
			ElgatoAudioRestartTimeoutError
		);
		for (let poll = 0; poll < 4; poll += 1) {
			await elapse();
		}

		await failure;
		expect(delays).toHaveLength(
			RESTART_TIMEOUT_MILLISECONDS / POLL_INTERVAL_MILLISECONDS
		);
	});

	it('should fail with the kill error when the kill fails and the server still runs', async () => {
		const { restarter, serverProcess } = createRestarter([true, true]);
		const killError = new ElgatoAudioProcessError(
			'kill',
			new Error('access denied')
		);
		serverProcess.kill.mockRejectedValueOnce(killError);

		await expect(restarter.restart()).rejects.toBe(killError);
	});

	it('should go on waiting when the kill fails but the server is already gone', async () => {
		const { restarter, serverProcess, elapse } = createRestarter([
			true,
			false,
			true,
		]);
		serverProcess.kill.mockRejectedValueOnce(
			new ElgatoAudioProcessError('kill', new Error('not found'))
		);

		const outcome = restarter.restart();
		await elapse();

		await expect(outcome).resolves.toBe('restarted');
	});

	it('should ignore a restart asked while another one is in progress', async () => {
		const { restarter, serverProcess, elapse } = createRestarter([true, true]);

		const first = restarter.restart();
		await flushPromises();
		const second = await restarter.restart();
		await elapse();
		await first;

		expect(second).toBe('ignored');
		expect(serverProcess.kill).toHaveBeenCalledTimes(1);
	});

	it('should accept a new restart once the previous one failed', async () => {
		const { restarter, serverProcess, elapse } = createRestarter([]);
		serverProcess.isRunning.mockRejectedValueOnce(
			new ElgatoAudioProcessError('list', new Error('timeout'))
		);
		await expect(restarter.restart()).rejects.toBeInstanceOf(
			ElgatoAudioProcessError
		);
		serverProcess.isRunning.mockResolvedValueOnce(false);
		serverProcess.isRunning.mockResolvedValueOnce(true);

		const retry = restarter.restart();
		await elapse();

		await expect(retry).resolves.toBe('restarted');
	});
});
