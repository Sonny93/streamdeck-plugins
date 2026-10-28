import { describe, expect, it, vi } from 'vitest';

import type { SpotifyPlaylist } from '../spotify/spotify_playlist';
import { PlaylistsCarouselRenderer } from './playlists_carousel_renderer';

vi.mock('@elgato/streamdeck', () => ({
	streamDeck: { logger: { debug: vi.fn() } },
}));

const COVER_DATA_URL = 'data:image/jpeg;base64,AQID';

function buildPlaylist(name: string, imageUrl?: string): SpotifyPlaylist {
	return {
		uri: `spotify:playlist:${name}`,
		name,
		imageUrl,
		kind: 'playlist',
		canAdd: true,
	};
}

function buildRenderer(
	options: Readonly<{
		playlists: readonly SpotifyPlaylist[];
		hasContent?: boolean;
		containsUris?: readonly string[];
		fetchResult?: boolean;
		backdropCover?: string;
	}>
) {
	const onCoversLoaded = vi.fn();
	const fetchCovers = vi.fn(() =>
		Promise.resolve(options.fetchResult ?? false)
	);
	const renderer = new PlaylistsCarouselRenderer({
		catalog: {
			playlists: options.playlists,
			hasContent: () => options.hasContent ?? true,
		},
		covers: {
			get: (url) => (url.endsWith('cached') ? COVER_DATA_URL : undefined),
			fetch: fetchCovers,
			retryFailed: vi.fn(),
		},
		presence: {
			contains: (_dialId, playlist) =>
				options.containsUris?.includes(playlist.uri) ?? false,
		},
		readBackdropCover: () => options.backdropCover,
		onCoversLoaded,
	});
	const setFeedback = vi.fn(() => Promise.resolve());
	return {
		renderer,
		onCoversLoaded,
		fetchCovers,
		dial: { id: 'dial', coordinates: { column: 1, row: 0 }, setFeedback },
	};
}

function readSvg(setFeedback: ReturnType<typeof vi.fn>): string {
	const [payload] = setFeedback.mock.calls.at(-1) ?? [];
	const dataUrl: unknown = payload?.canvas;
	return Buffer.from(String(dataUrl).split(',')[1] ?? '', 'base64').toString(
		'utf8'
	);
}

describe('PlaylistsCarouselRenderer', () => {
	it('should draw the centered playlist title and position', async () => {
		const { renderer, dial } = buildRenderer({
			playlists: [buildPlaylist('A'), buildPlaylist('B'), buildPlaylist('C')],
		});

		await renderer.render({ dial, position: 1.2 });

		const svg = readSvg(dial.setFeedback);
		expect(svg).toContain('>B</text>');
		expect(svg).toContain('>2 / 3</text>');
	});

	it('should draw the slice of the playing track cover of the dial column behind the carousel', async () => {
		const { renderer, dial } = buildRenderer({
			playlists: [buildPlaylist('A')],
			backdropCover: 'data:backdrop',
		});

		await renderer.render({ dial, position: 0 });

		expect(readSvg(dial.setFeedback)).toContain(
			'<image x="-200" y="-350" width="800" height="800" preserveAspectRatio="xMidYMid slice" opacity="0.25" xlink:href="data:backdrop"/>'
		);
	});

	it('should send the frame as an svg data url on the canvas key', async () => {
		const { renderer, dial } = buildRenderer({
			playlists: [buildPlaylist('A')],
		});

		await renderer.render({ dial, position: 0 });

		expect(dial.setFeedback).toHaveBeenCalledWith({
			canvas: expect.stringMatching(/^data:image\/svg\+xml;base64,/),
		});
	});

	it('should wrap around the list for a negative position', async () => {
		const { renderer, dial } = buildRenderer({
			playlists: [buildPlaylist('A'), buildPlaylist('B'), buildPlaylist('C')],
		});

		await renderer.render({ dial, position: -1 });

		expect(readSvg(dial.setFeedback)).toContain('>C</text>');
	});

	it('should embed the cached covers', async () => {
		const { renderer, dial } = buildRenderer({
			playlists: [buildPlaylist('A', 'https://x/cached')],
		});

		await renderer.render({ dial, position: 0 });

		expect(readSvg(dial.setFeedback)).toContain(COVER_DATA_URL);
	});

	it('should load the missing covers in the background', async () => {
		const { renderer, dial, fetchCovers } = buildRenderer({
			playlists: [buildPlaylist('A', 'https://x/missing')],
		});

		await renderer.render({ dial, position: 0 });

		expect(fetchCovers).toHaveBeenCalledWith(['https://x/missing']);
	});

	it('should ask for a redraw when background covers arrive', async () => {
		const { renderer, dial, onCoversLoaded } = buildRenderer({
			playlists: [buildPlaylist('A', 'https://x/missing')],
			fetchResult: true,
		});

		await renderer.render({ dial, position: 0 });
		await vi.waitFor(() => expect(onCoversLoaded).toHaveBeenCalledTimes(1));
	});

	it('should show the heart only for the centered playlist that contains the playing track', async () => {
		const { renderer, dial } = buildRenderer({
			playlists: [buildPlaylist('A'), buildPlaylist('B')],
			containsUris: ['spotify:playlist:B'],
		});

		await renderer.render({ dial, position: 0 });
		expect(readSvg(dial.setFeedback)).not.toContain('#1DB954');

		await renderer.render({ dial, position: 1 });
		expect(readSvg(dial.setFeedback)).toContain('#1DB954');
	});

	it('should not show the heart on the frames of a scroll', async () => {
		const { renderer, dial } = buildRenderer({
			playlists: [buildPlaylist('A')],
			containsUris: ['spotify:playlist:A'],
		});

		await renderer.renderAnimationFrame({ dial, position: 0 });

		expect(readSvg(dial.setFeedback)).not.toContain('#1DB954');
	});

	it('should say Spotify is closed when there is no playlist', async () => {
		const { renderer, dial } = buildRenderer({ playlists: [] });

		await renderer.render({ dial, position: 0 });

		const svg = readSvg(dial.setFeedback);
		expect(svg).toContain('>Spotify closed</text>');
		expect(svg).not.toContain('text-anchor="end"');
	});

	it('should draw nothing while there is nothing to show', async () => {
		const { renderer, dial } = buildRenderer({
			playlists: [],
			hasContent: false,
		});

		await renderer.render({ dial, position: 0 });

		expect(dial.setFeedback).not.toHaveBeenCalled();
	});

	it('should preload the covers of the neighbours of an index', () => {
		const playlists = ['a', 'b', 'c', 'd', 'e', 'f'].map((name) =>
			buildPlaylist(name, `https://x/${name}`)
		);
		const { renderer, fetchCovers } = buildRenderer({ playlists });

		renderer.preload(0);

		expect(fetchCovers).toHaveBeenCalledWith([
			'https://x/e',
			'https://x/f',
			'https://x/a',
			'https://x/b',
			'https://x/c',
		]);
	});

	it('should send the animation frames like the other ones', async () => {
		const { renderer, dial } = buildRenderer({
			playlists: [buildPlaylist('A')],
		});

		await renderer.renderAnimationFrame({ dial, position: 0 });
		await renderer.renderAnimationFrame({ dial, position: 0 });

		expect(dial.setFeedback).toHaveBeenCalledTimes(2);
	});
});
