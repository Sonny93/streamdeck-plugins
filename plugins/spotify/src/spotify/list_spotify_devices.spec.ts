import { afterEach, describe, expect, it, vi } from 'vitest';

import { buildFakePlatformSession } from './build_fake_platform_session';
import { listSpotifyDevices } from './list_spotify_devices';
import { SpotifyEvaluationError } from './spotify_evaluation_error';

function buildDevice(overrides: Record<string, unknown> = {}) {
	return {
		id: 'local_device',
		name: 'DESKTOP',
		type: 'computer',
		isActive: false,
		isLocal: true,
		...overrides,
	};
}

function buildSession(devices: unknown[] | undefined) {
	const connect = {
		getState: vi.fn(() =>
			devices === undefined ? null : { devices, activeDevice: null }
		),
		updateListOfDevices: vi.fn(() => Promise.resolve()),
	};
	const { session } = buildFakePlatformSession({ ConnectAPI: connect });
	return { session, connect };
}

describe('listSpotifyDevices', () => {
	afterEach(() => {
		vi.useRealTimers();
	});

	it('should list the devices in the order of Spotify', async () => {
		const { session } = buildSession([
			buildDevice(),
			buildDevice({ id: 'phone', name: 'Phone', type: 'Smartphone' }),
		]);

		const devices = await listSpotifyDevices({ shouldDiscover: false })(
			session
		);

		expect(devices).toEqual([
			{
				id: 'local_device',
				name: 'DESKTOP',
				kind: 'computer',
				isActive: false,
			},
			{ id: 'phone', name: 'Phone', kind: 'phone', isActive: false },
		]);
	});

	it('should tell which device plays', async () => {
		const { session } = buildSession([buildDevice({ isActive: true })]);

		const [device] = await listSpotifyDevices({ shouldDiscover: false })(
			session
		);

		expect(device?.isActive).toBe(true);
	});

	it.each([
		['tv', 'tv'],
		['cast_video', 'tv'],
		['tablet', 'phone'],
		['chromebook', 'computer'],
		['speaker', 'speaker'],
		['avr', 'speaker'],
	])('should draw a device of type %s as a %s', async (type, kind) => {
		const { session } = buildSession([buildDevice({ type })]);

		const [device] = await listSpotifyDevices({ shouldDiscover: false })(
			session
		);

		expect(device?.kind).toBe(kind);
	});

	it('should give an empty list while Spotify has no Connect state', async () => {
		const { session } = buildSession(undefined);

		expect(
			await listSpotifyDevices({ shouldDiscover: false })(session)
		).toEqual([]);
	});

	it('should not look for devices again unless asked', async () => {
		const { session, connect } = buildSession([buildDevice()]);

		await listSpotifyDevices({ shouldDiscover: false })(session);

		expect(connect.updateListOfDevices).not.toHaveBeenCalled();
	});

	it('should look for devices again, then read the list a moment later', async () => {
		vi.useFakeTimers();
		const { session, connect } = buildSession([buildDevice()]);

		const listing = listSpotifyDevices({ shouldDiscover: true })(session);
		await vi.advanceTimersByTimeAsync(0);

		expect(connect.updateListOfDevices).toHaveBeenCalledTimes(1);
		expect(connect.getState).not.toHaveBeenCalled();
		await vi.advanceTimersByTimeAsync(1_500);
		expect(await listing).toHaveLength(1);
	});

	it('should throw an evaluation error when a device has an unexpected shape', async () => {
		const { session } = buildSession([buildDevice({ name: 42 })]);

		await expect(
			listSpotifyDevices({ shouldDiscover: false })(session)
		).rejects.toThrow(SpotifyEvaluationError);
	});
});
