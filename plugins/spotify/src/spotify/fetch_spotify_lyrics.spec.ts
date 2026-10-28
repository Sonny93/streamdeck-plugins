import { describe, expect, it, vi } from 'vitest';

import { buildFakePlatformSession } from './build_fake_platform_session';
import { fetchSpotifyLyrics } from './fetch_spotify_lyrics';

type TransportRequest = (
	url: string,
	options: Readonly<Record<string, unknown>>
) => Promise<unknown>;

function buildSession(response: unknown) {
	const request = vi.fn<TransportRequest>(() => Promise.resolve(response));
	const { session } = buildFakePlatformSession(
		{},
		{ getTransport: () => ({ request }) }
	);
	return { session, request };
}

const SYNCED_BODY = {
	lyrics: {
		syncType: 'LINE_SYNCED',
		lines: [{ startTimeMs: '50', words: 'Hola', syllables: [] }],
	},
};

describe('fetchSpotifyLyrics', () => {
	it('should ask the lyrics endpoint for the track through the authorized transport', async () => {
		const { session, request } = buildSession({
			status: 200,
			body: SYNCED_BODY,
		});

		await fetchSpotifyLyrics(session, '6b37xrsNCWYIUphFBazqD6');

		expect(request).toHaveBeenCalledWith(
			'https://spclient.wg.spotify.com/color-lyrics/v2/track/6b37xrsNCWYIUphFBazqD6?format=json&vocalRemoval=false&market=from_token',
			expect.objectContaining({ method: 'GET', authorize: true })
		);
	});

	it('should return the synced lines', async () => {
		const { session } = buildSession({ status: 200, body: SYNCED_BODY });

		expect(await fetchSpotifyLyrics(session, 'a')).toEqual([
			{ startMilliseconds: 50, words: 'Hola' },
		]);
	});

	it('should read a body that comes as text', async () => {
		const { session } = buildSession({
			status: 200,
			body: JSON.stringify(SYNCED_BODY),
		});

		expect(await fetchSpotifyLyrics(session, 'a')).toHaveLength(1);
	});

	it('should return no line when the track has no lyrics', async () => {
		const { session } = buildSession({ status: 404, body: '' });

		expect(await fetchSpotifyLyrics(session, 'a')).toEqual([]);
	});
});
