import type { SpotifySession } from './spotify_session';

/** Runs `use` with an open session, and always closes both CDP connections afterwards. */
export async function useSpotifySession<TResult>(
	session: SpotifySession,
	use: (session: SpotifySession) => Promise<TResult>
): Promise<TResult> {
	try {
		return await use(session);
	} finally {
		session.page.close();
		session.browser.close();
	}
}
