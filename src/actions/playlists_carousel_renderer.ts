import { streamDeck } from '@elgato/streamdeck';
import type { DialAction } from '@elgato/streamdeck';

import { wrapIndex } from './wrap_index';
import { toSvgDataUrl } from './to_svg_data_url';
import type { CarouselSlot } from './carousel_slot';
import { CarouselMetrics } from './carousel_metrics';
import type { SpotifyPlaylist } from '../spotify/spotify_playlist';
import { buildCarouselFrameSvg } from './build_carousel_frame_svg';
import { formatPlaylistPosition } from './format_playlist_position';
import type { PlaylistsDialSettings } from './playlists_dial_settings';
import type { PlaylistsCarouselRendererOptions } from './playlists_carousel_renderer_options';

const SPOTIFY_CLOSED_TITLE = 'Spotify closed';
const CANVAS_FEEDBACK_KEY = 'canvas';

type RenderableDial = Pick<
	DialAction<PlaylistsDialSettings>,
	'id' | 'setFeedback'
>;

type FrameRequest = Readonly<{ dial: RenderableDial; position: number }>;

function listNeighbourhood(center: number): number[] {
	const { neighbourCount } = CarouselMetrics;
	return Array.from(
		{ length: neighbourCount * 2 + 1 },
		(_, step) => center - neighbourCount + step
	);
}

/**
 * Draws the carousel frames of the "Playlists" dial on its touch strip, one full-strip image per frame.
 * A frame shows the covers around a (fractional) position; covers that are not cached yet are drawn as the Liked Songs look and loaded in the background.
 * Without any playlist (Spotify is unreachable) it draws "Spotify closed" over the fallback cover.
 */
export class PlaylistsCarouselRenderer {
	private readonly timedDials = new Set<string>();

	constructor(private readonly options: PlaylistsCarouselRendererOptions) {}

	/** Draws the frame for a position; does nothing while there is neither a playlist list nor a failure to report. */
	async render(request: FrameRequest): Promise<void> {
		if (!this.options.catalog.hasContent()) {
			return;
		}
		const svg = this.buildFrame(request.position);
		await request.dial.setFeedback({
			[CANVAS_FEEDBACK_KEY]: toSvgDataUrl(svg),
		});
	}

	/** Draws a frame of a scroll, logging at debug level how long the first one of a dial took to send. */
	async renderAnimationFrame(request: FrameRequest): Promise<void> {
		if (this.timedDials.has(request.dial.id)) {
			await this.render(request);
			return;
		}
		this.timedDials.add(request.dial.id);
		const startedAt = performance.now();
		await this.render(request);
		const elapsed = Math.round(performance.now() - startedAt);
		streamDeck.logger.debug(`First carousel frame sent in ${elapsed} ms`);
	}

	/** Forgets what is known of a dial that disappeared, so its next first frame is timed again. */
	forget(dialId: string): void {
		this.timedDials.delete(dialId);
	}

	/** Loads in the background the covers around a settled index, and asks for a redraw when some arrive. */
	preload(index: number): void {
		this.options.covers.retryFailed();
		const urls = listNeighbourhood(index).flatMap((slotIndex) => {
			const url = this.playlistAt(slotIndex)?.imageUrl;
			return url === undefined ? [] : [url];
		});
		this.loadInBackground(urls);
	}

	private playlistAt(index: number): SpotifyPlaylist | undefined {
		const { playlists } = this.options.catalog;
		return playlists[wrapIndex({ index, length: playlists.length })];
	}

	private loadInBackground(urls: readonly string[]): void {
		if (urls.length === 0) {
			return;
		}
		void this.options.covers.fetch([...new Set(urls)]).then((loaded) => {
			if (loaded) {
				this.options.onCoversLoaded();
			}
		});
	}

	private buildFrame(position: number): string {
		const { playlists } = this.options.catalog;
		const center = Math.round(position);
		const centered = this.playlistAt(center);
		if (centered === undefined) {
			return buildCarouselFrameSvg({
				position,
				slots: [{ offset: 0, coverDataUrl: undefined }],
				title: SPOTIFY_CLOSED_TITLE,
				positionLabel: '',
				isLikeTarget: false,
			});
		}
		const slots = listNeighbourhood(center).map((slotIndex): CarouselSlot => ({
			offset: slotIndex - position,
			coverDataUrl: this.readCover(this.playlistAt(slotIndex)),
		}));
		this.loadInBackground(this.listMissingCovers(center));
		return buildCarouselFrameSvg({
			position,
			slots,
			title: centered.name,
			positionLabel: formatPlaylistPosition({
				index: wrapIndex({ index: center, length: playlists.length }),
				total: playlists.length,
			}),
			isLikeTarget: centered.uri === this.options.likeTargetStore.current?.uri,
		});
	}

	private listMissingCovers(center: number): string[] {
		return listNeighbourhood(center).flatMap((slotIndex) => {
			const url = this.playlistAt(slotIndex)?.imageUrl;
			return url === undefined || this.options.covers.get(url) !== undefined
				? []
				: [url];
		});
	}

	private readCover(playlist: SpotifyPlaylist | undefined): string | undefined {
		const url = playlist?.imageUrl;
		return url === undefined ? undefined : this.options.covers.get(url);
	}
}
