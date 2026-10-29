import { parseDeviceListing } from './parse_device_listing';
import { runPlatformScript } from './run_platform_script';
import type { SpotifyDevice } from './spotify_device';
import { SpotifyServices } from './spotify_services';
import type { SpotifySession } from './spotify_session';

/** How long the devices that answer a new discovery get to show up before the list is read. */
const DISCOVERY_SETTLE_MILLISECONDS = 1_500;

function buildListDevicesBody(shouldDiscover: boolean): string {
	return `
		const connect = resolve(${JSON.stringify(SpotifyServices.connect)});
		if (${JSON.stringify(shouldDiscover)}) {
			await connect.updateListOfDevices();
			await new Promise((done) => setTimeout(done, ${JSON.stringify(DISCOVERY_SETTLE_MILLISECONDS)}));
		}
		const devices = connect.getState()?.devices ?? [];
		return {
			devices: devices.map((device) => ({
				id: device.id,
				name: device.name,
				type: device.type,
				isActive: device.isActive === true,
			})),
		};
	`;
}

/**
 * Lists the Spotify Connect devices Spotify knows about, this computer included.
 * With `shouldDiscover`, Spotify first looks for devices again (local network, sleeping devices of the account) and the list is read a moment later.
 */
export function listSpotifyDevices(
	options: Readonly<{ shouldDiscover: boolean }>
): (session: SpotifySession) => Promise<SpotifyDevice[]> {
	const body = buildListDevicesBody(options.shouldDiscover);
	return async (session) =>
		parseDeviceListing(await runPlatformScript(session, body));
}
