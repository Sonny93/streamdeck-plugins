import { describe, expect, it, vi } from 'vitest';

import { buildFakePlatformSession } from './build_fake_platform_session';
import { SpotifyDeviceNotFoundError } from './spotify_device_not_found_error';
import { transferSpotifyPlayback } from './transfer_spotify_playback';

const PHONE_ID = 'phone';

function buildSession(
	options: Readonly<{ deviceIds: string[]; activeDeviceId: string | null }>
) {
	const connect = {
		getState: () => ({
			activeDevice:
				options.activeDeviceId === null ? null : { id: options.activeDeviceId },
			devices: options.deviceIds.map((id) => ({ id })),
		}),
		transferPlayback: vi.fn(() => Promise.resolve()),
	};
	const { session } = buildFakePlatformSession({ ConnectAPI: connect });
	return { session, connect };
}

describe('transferSpotifyPlayback', () => {
	it('should move playback to the device', async () => {
		const { session, connect } = buildSession({
			deviceIds: ['local_device', PHONE_ID],
			activeDeviceId: 'local_device',
		});

		await transferSpotifyPlayback(PHONE_ID)(session);

		expect(connect.transferPlayback).toHaveBeenCalledWith(PHONE_ID, {
			interactionId: expect.any(String),
		});
	});

	it('should do nothing when the device already plays', async () => {
		const { session, connect } = buildSession({
			deviceIds: [PHONE_ID],
			activeDeviceId: PHONE_ID,
		});

		await transferSpotifyPlayback(PHONE_ID)(session);

		expect(connect.transferPlayback).not.toHaveBeenCalled();
	});

	it('should move playback while no device plays', async () => {
		const { session, connect } = buildSession({
			deviceIds: [PHONE_ID],
			activeDeviceId: null,
		});

		await transferSpotifyPlayback(PHONE_ID)(session);

		expect(connect.transferPlayback).toHaveBeenCalledTimes(1);
	});

	it('should throw a device not found error when Spotify does not list the device', async () => {
		const { session, connect } = buildSession({
			deviceIds: ['local_device'],
			activeDeviceId: 'local_device',
		});

		await expect(transferSpotifyPlayback(PHONE_ID)(session)).rejects.toThrow(
			SpotifyDeviceNotFoundError
		);
		expect(connect.transferPlayback).not.toHaveBeenCalled();
	});
});
