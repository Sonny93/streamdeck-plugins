import type { CdpConnection } from '../cdp/cdp_connection';

/** Open CDP connections for one key press: the browser (window control) and the Spotify UI page (DOM). */
export type SpotifySession = Readonly<{
	browser: CdpConnection;
	page: CdpConnection;
	pageTargetId: string;
	launchedByPlugin: boolean;
}>;
