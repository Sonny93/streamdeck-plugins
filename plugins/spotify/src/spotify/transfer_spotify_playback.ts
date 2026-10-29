import { randomUUID } from 'node:crypto';

import { parseTransferOutcome } from './parse_transfer_outcome';
import { runPlatformScript } from './run_platform_script';
import type { SpotifyCommand } from './spotify_command';
import { SpotifyServices } from './spotify_services';
import { SpotifyTransferOutcome } from './spotify_transfer_outcome';

function buildBody(deviceId: string, interactionId: string): string {
	return `
		const deviceId = ${JSON.stringify(deviceId)};
		const connect = resolve(${JSON.stringify(SpotifyServices.connect)});
		const state = connect.getState();
		if (state?.activeDevice?.id === deviceId) {
			return { outcome: ${JSON.stringify(SpotifyTransferOutcome.alreadyActive)} };
		}
		if (!(state?.devices ?? []).some((device) => device.id === deviceId)) {
			return { outcome: ${JSON.stringify(SpotifyTransferOutcome.deviceNotFound)} };
		}
		await connect.transferPlayback(deviceId, { interactionId: ${JSON.stringify(interactionId)} });
		return { outcome: ${JSON.stringify(SpotifyTransferOutcome.transferred)} };
	`;
}

/**
 * Builds the command that moves playback to a Spotify Connect device, the way Spotify's own device picker does; nothing happens when it already plays there.
 * Rejects with `SpotifyDeviceNotFoundError` when Spotify does not list the device.
 */
export function transferSpotifyPlayback(deviceId: string): SpotifyCommand {
	return async (session) => {
		parseTransferOutcome(
			await runPlatformScript(session, buildBody(deviceId, randomUUID())),
			deviceId
		);
	};
}
