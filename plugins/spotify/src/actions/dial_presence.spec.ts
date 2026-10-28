import { describe, expect, it, vi } from 'vitest';

import type { SpotifyPlaylist } from '../spotify/spotify_playlist';
import { DialPresence } from './dial_presence';

vi.mock('@elgato/streamdeck', () => ({
	streamDeck: { logger: { debug: vi.fn() } },
}));

const TRACK_A = 'spotify:track:a';
const TRACK_B = 'spotify:track:b';

function buildPlaylist(name: string): SpotifyPlaylist {
	return {
		uri: `spotify:playlist:${name}`,
		name,
		imageUrl: undefined,
		kind: 'playlist',
		canAdd: true,
	};
}

const PLAYLIST_A = buildPlaylist('a');
const PLAYLIST_B = buildPlaylist('b');

type PlayerState = {
	isPaused: boolean;
	trackUri: string | undefined;
	track: undefined;
};

function buildPresence(isInTarget: (trackUri: string) => boolean) {
	const hub: { current: PlayerState | undefined } = {
		current: { isPaused: false, trackUri: TRACK_A, track: undefined },
	};
	const onChange = vi.fn();
	const queryMock = vi.fn((options: Readonly<{ trackUri: string }>) =>
		Promise.resolve(isInTarget(options.trackUri))
	);
	const presence = new DialPresence({
		playerStateHub: hub,
		query: queryMock,
		onChange,
	});
	presence.add('dial');
	return { presence, hub, onChange, queryMock };
}

describe('DialPresence', () => {
	it('should report that the playing track is in the centered playlist', async () => {
		const { presence } = buildPresence(() => true);

		await presence.refresh('dial', PLAYLIST_A);

		expect(presence.contains('dial', PLAYLIST_A)).toBe(true);
	});

	it('should not report the presence for another playlist than the centered one', async () => {
		const { presence } = buildPresence(() => true);

		await presence.refresh('dial', PLAYLIST_A);

		expect(presence.contains('dial', PLAYLIST_B)).toBe(false);
	});

	it('should check the playing track against the playlist', async () => {
		const { presence, queryMock } = buildPresence(() => true);

		await presence.refresh('dial', PLAYLIST_A);

		expect(queryMock).toHaveBeenCalledWith({
			trackUri: TRACK_A,
			target: { uri: PLAYLIST_A.uri, kind: 'playlist' },
		});
	});

	it('should not report the presence while nothing plays', async () => {
		const { presence, hub, queryMock } = buildPresence(() => true);
		hub.current = { isPaused: true, trackUri: undefined, track: undefined };

		await presence.refresh('dial', PLAYLIST_A);

		expect(queryMock).not.toHaveBeenCalled();
		expect(presence.contains('dial', PLAYLIST_A)).toBe(false);
	});

	it('should check the centered playlist of every dial again when the track changes', async () => {
		const { presence, hub, queryMock } = buildPresence(
			(trackUri) => trackUri === TRACK_B
		);
		await presence.refresh('dial', PLAYLIST_A);
		hub.current = { isPaused: false, trackUri: TRACK_B, track: undefined };

		await presence.refreshAll();

		expect(queryMock).toHaveBeenCalledTimes(2);
		expect(presence.contains('dial', PLAYLIST_A)).toBe(true);
	});

	it('should tell which dial changed', async () => {
		const { presence, onChange } = buildPresence(() => true);

		await presence.refresh('dial', PLAYLIST_A);

		expect(onChange).toHaveBeenCalledWith('dial');
	});

	it('should report the presence after the track was added', async () => {
		const { presence } = buildPresence(() => false);
		await presence.refresh('dial', PLAYLIST_A);

		presence.markAdded('dial');

		expect(presence.contains('dial', PLAYLIST_A)).toBe(true);
	});

	it('should keep each dial separate', async () => {
		const { presence } = buildPresence(() => true);
		presence.add('other');

		await presence.refresh('dial', PLAYLIST_A);

		expect(presence.contains('other', PLAYLIST_A)).toBe(false);
	});

	it('should forget a dial that disappeared', async () => {
		const { presence, queryMock } = buildPresence(() => true);
		await presence.refresh('dial', PLAYLIST_A);

		presence.remove('dial');
		await presence.refreshAll();

		expect(queryMock).toHaveBeenCalledTimes(1);
		expect(presence.contains('dial', PLAYLIST_A)).toBe(false);
	});

	it('should stop checking a dial that shows no playlist', async () => {
		const { presence, queryMock } = buildPresence(() => true);
		await presence.refresh('dial', PLAYLIST_A);

		await presence.refresh('dial', undefined);
		await presence.refreshAll();

		expect(queryMock).toHaveBeenCalledTimes(1);
	});
});
