import { SpotifyEndpoint } from './spotify_endpoint';
import type { SpotifyTarget } from './spotify_target';
import type { SpotifyPageTarget } from './spotify_page_target';

const PAGE_TARGET_TYPE = 'page';

/** Picks the Spotify UI page among DevTools targets, ignoring browser UI and other targets. */
export function findSpotifyPageTarget(
	targets: ReadonlyArray<SpotifyTarget>
): SpotifyPageTarget | undefined {
	for (const target of targets) {
		const isSpotifyPage =
			target.type === PAGE_TARGET_TYPE &&
			target.url.startsWith(SpotifyEndpoint.pageUrlPrefix);
		if (isSpotifyPage && target.webSocketDebuggerUrl !== undefined) {
			return {
				id: target.id,
				webSocketDebuggerUrl: target.webSocketDebuggerUrl,
			};
		}
	}
	return undefined;
}
