import type { SpotifyLyricsLine } from '../spotify/spotify_lyrics_line';
import { buildNowPlayingLyrics } from './build_now_playing_lyrics';
import { buildNowPlayingSvg } from './build_now_playing_svg';
import { findCurrentLyricIndex } from './find_current_lyric_index';
import { LyricsTransitionTracker } from './lyrics_transition_tracker';
import type { NowPlayingDial } from './now_playing_dial';
import type { NowPlayingFrame } from './now_playing_frame';
import { NowPlayingMetrics } from './now_playing_metrics';
import type { NowPlayingScreenOptions } from './now_playing_screen_options';
import { NowPlayingTiming } from './now_playing_timing';
import { ProgressTicker } from './progress_ticker';
import { resolvePlaybackPosition } from './resolve_playback_position';
import { toSvgDataUrl } from './to_svg_data_url';

const CANVAS_FEEDBACK_KEY = 'canvas';

type LoadedCover = Readonly<{ url: string; dataUrl: string | undefined }>;

function isUnderLyrics(column: number): boolean {
	const { segmentWidth, lyrics } = NowPlayingMetrics;
	const sliceLeft = column * segmentWidth;
	return sliceLeft < lyrics.right && sliceLeft + segmentWidth > lyrics.left;
}

type LoadedLyrics = Readonly<{
	trackUri: string;
	lines: readonly SpotifyLyricsLine[];
}>;

/**
 * Shows the playing track (cover, title, artists, progress) across the whole touch strip while the Stream Deck is inactive.
 * Every dial of the plugin attaches itself and draws the slice of its column; a column without a dial of the plugin stays as it is.
 * It shows only while a track is loaded, redraws on every player change and, while playing, every second for the progress bar.
 * The cover is also offered to the dials as the backdrop of their own content (`backdropCover`), kept until the next one is downloaded.
 * Only the cover and the synced lyrics of the current track are kept; they are fetched as soon as the track is known, and not retried when it fails.
 * With lyrics, it also redraws when the next line starts, so the line shown follows the song, and animates the change on the dials under the lyrics.
 */
export class NowPlayingScreen {
	private readonly dials = new Map<string, NowPlayingDial>();
	private readonly hiddenListeners = new Set<() => void>();
	private readonly backdropListeners = new Set<() => void>();
	private readonly ticker: ProgressTicker;
	private showing = false;
	private cover: LoadedCover | undefined;
	private backdrop: string | undefined;
	private lyrics: LoadedLyrics | undefined;
	private cancelLineChange: (() => void) | undefined;
	private cancelLyricsFrame: (() => void) | undefined;
	private readonly lyricsTransitions = new LyricsTransitionTracker(
		NowPlayingTiming.lyricsTransitionMilliseconds
	);
	private unsubscribes: (() => void)[] | undefined;

	constructor(private readonly options: NowPlayingScreenOptions) {
		this.ticker = new ProgressTicker({
			schedule: options.schedule,
			intervalMilliseconds: NowPlayingTiming.progressIntervalMilliseconds,
			onTick: () => {
				this.renderInBackground();
			},
		});
	}

	/** Whether the dials currently show the playing track instead of their own content. */
	get isShowing(): boolean {
		return this.showing;
	}

	/** Adds a dial that appeared (or replaces it when it moved), drawing on it at once while the screen shows; the first dial starts the screen. */
	attach(dial: NowPlayingDial): void {
		this.dials.set(dial.id, dial);
		this.start();
		if (this.showing) {
			this.renderInBackground();
		}
	}

	/** Removes a dial that disappeared; the last one stops the screen. */
	detach(dialId: string): void {
		this.dials.delete(dialId);
		if (this.dials.size === 0) {
			this.stop();
		}
	}

	/** Registers what to do when the screen goes away, i.e. redraw the dial's own content, and returns the function that unsubscribes it. */
	onHidden(listener: () => void): () => void {
		this.hiddenListeners.add(listener);
		return () => {
			this.hiddenListeners.delete(listener);
		};
	}

	/** The cover of the playing track, once downloaded, for the dials to draw behind their own content; `undefined` when the track has none. */
	get backdropCover(): string | undefined {
		return this.backdrop;
	}

	/** Registers what to do when `backdropCover` changes, i.e. redraw the dial's own content, and returns the function that unsubscribes it. */
	onBackdropChanged(listener: () => void): () => void {
		this.backdropListeners.add(listener);
		return () => {
			this.backdropListeners.delete(listener);
		};
	}

	/** Records an interaction on a dial; returns whether the screen was showing, i.e. the interaction only woke the dials. */
	wake(): boolean {
		const wasShowing = this.showing;
		this.options.inactivity.recordActivity();
		return wasShowing;
	}

	/** Draws the playing track on every attached dial; does nothing while the screen is not showing. */
	async render(): Promise<void> {
		await this.renderDials([...this.dials.values()]);
	}

	private async renderDials(dials: readonly NowPlayingDial[]): Promise<void> {
		const frame = this.buildFrame();
		if (!this.showing || frame === undefined) {
			return;
		}
		await Promise.all(
			dials.map((dial) =>
				dial.setFeedback({
					[CANVAS_FEEDBACK_KEY]: toSvgDataUrl(
						buildNowPlayingSvg({
							frame,
							sliceLeft: dial.column * NowPlayingMetrics.segmentWidth,
						})
					),
				})
			)
		);
	}

	private start(): void {
		this.unsubscribes ??= [
			this.options.inactivity.subscribe(() => {
				this.update();
			}),
			this.options.playerStateHub.subscribe(() => {
				this.update();
			}),
		];
	}

	private stop(): void {
		for (const unsubscribe of this.unsubscribes ?? []) {
			unsubscribe();
		}
		this.unsubscribes = undefined;
		this.ticker.stop();
		this.stopLineChange();
		this.stopLyricsFrames();
		this.showing = false;
	}

	private buildFrame(): NowPlayingFrame | undefined {
		const state = this.options.playerStateHub.current;
		const track = state?.track;
		if (track === undefined) {
			return undefined;
		}
		const isPaused = state?.isPaused ?? true;
		const now = this.options.now();
		const positionMilliseconds = resolvePlaybackPosition({
			track,
			isPaused,
			now,
		});
		const lines = this.readLyrics(state?.trackUri);
		const lyrics = buildNowPlayingLyrics({ lines, positionMilliseconds });
		return {
			title: track.title,
			artistNames: track.artistNames,
			coverDataUrl: this.readCover(track.imageUrl),
			lyrics,
			lyricsTransition: this.lyricsTransitions.follow({
				trackUri: state?.trackUri,
				index: findCurrentLyricIndex({ lines, positionMilliseconds }),
				lyrics,
				now,
			}),
			positionMilliseconds,
			durationMilliseconds: track.durationMilliseconds,
			isPaused,
		};
	}

	private update(): void {
		const state = this.options.playerStateHub.current;
		this.readCover(state?.track?.imageUrl);
		if (state?.track?.imageUrl === undefined) {
			this.setBackdrop(undefined);
		}
		this.readLyrics(state?.trackUri);
		const wasShowing = this.showing;
		this.showing =
			this.options.inactivity.isInactive && state?.track !== undefined;
		if (this.showing) {
			this.ticker.restart(state?.isPaused === false);
			this.scheduleLineChange();
			this.renderInBackground();
			return;
		}
		this.ticker.stop();
		this.stopLineChange();
		this.stopLyricsFrames();
		if (wasShowing) {
			for (const listener of this.hiddenListeners) {
				listener();
			}
		}
	}

	private renderInBackground(): void {
		this.render().catch(this.options.onError);
	}

	private readCover(url: string | undefined): string | undefined {
		if (url === undefined) {
			return undefined;
		}
		if (this.cover?.url === url) {
			return this.cover.dataUrl;
		}
		this.cover = { url, dataUrl: undefined };
		void this.loadCover(url);
		return undefined;
	}

	private async loadCover(url: string): Promise<void> {
		try {
			const dataUrl = await this.options.fetchCover(url);
			if (this.cover?.url !== url) {
				return;
			}
			this.cover = { url, dataUrl };
			this.setBackdrop(dataUrl);
			await this.render();
		} catch (error) {
			if (this.cover?.url === url) {
				this.setBackdrop(undefined);
			}
			this.options.onError(error);
		}
	}

	private setBackdrop(dataUrl: string | undefined): void {
		if (this.backdrop === dataUrl) {
			return;
		}
		this.backdrop = dataUrl;
		for (const listener of this.backdropListeners) {
			listener();
		}
	}

	private readLyrics(
		trackUri: string | undefined
	): readonly SpotifyLyricsLine[] {
		if (trackUri === undefined) {
			return [];
		}
		if (this.lyrics?.trackUri === trackUri) {
			return this.lyrics.lines;
		}
		this.lyrics = { trackUri, lines: [] };
		void this.loadLyrics(trackUri);
		return [];
	}

	private async loadLyrics(trackUri: string): Promise<void> {
		try {
			const lines = await this.options.fetchLyrics(trackUri);
			if (this.lyrics?.trackUri !== trackUri) {
				return;
			}
			this.lyrics = { trackUri, lines };
			this.scheduleLineChange();
			await this.render();
		} catch (error) {
			this.options.onError(error);
		}
	}

	/** While showing a playing track with lyrics, schedules a redraw for when the next line starts (then the one after it). */
	private scheduleLineChange(): void {
		this.stopLineChange();
		const state = this.options.playerStateHub.current;
		const track = state?.track;
		if (
			!this.showing ||
			state === undefined ||
			track === undefined ||
			state.isPaused ||
			track.playbackSpeed <= 0
		) {
			return;
		}
		const lines = this.readLyrics(state.trackUri);
		const positionMilliseconds = resolvePlaybackPosition({
			track,
			isPaused: false,
			now: this.options.now(),
		});
		const nextLine =
			lines[findCurrentLyricIndex({ lines, positionMilliseconds }) + 1];
		if (nextLine === undefined) {
			return;
		}
		const delay =
			(nextLine.startMilliseconds - positionMilliseconds) / track.playbackSpeed;
		this.cancelLineChange = this.options.schedule(
			() => {
				this.cancelLineChange = undefined;
				this.scheduleLineChange();
				this.renderInBackground();
				if (this.lyricsTransitions.isAnimating) {
					this.scheduleLyricsFrame();
				}
			},
			Math.max(0, delay)
		);
	}

	private stopLineChange(): void {
		this.cancelLineChange?.();
		this.cancelLineChange = undefined;
	}

	/** Schedules the next frame of a change of lyric line, drawn only on the dials under the lyrics; frames never queue up. */
	private scheduleLyricsFrame(): void {
		this.stopLyricsFrames();
		this.cancelLyricsFrame = this.options.schedule(() => {
			this.cancelLyricsFrame = undefined;
			void this.renderLyricsFrame();
		}, NowPlayingTiming.lyricsFrameIntervalMilliseconds);
	}

	private async renderLyricsFrame(): Promise<void> {
		try {
			await this.renderDials(
				[...this.dials.values()].filter((dial) => isUnderLyrics(dial.column))
			);
		} catch (error) {
			this.options.onError(error);
		}
		if (this.showing && this.lyricsTransitions.isAnimating) {
			this.scheduleLyricsFrame();
		}
	}

	private stopLyricsFrames(): void {
		this.cancelLyricsFrame?.();
		this.cancelLyricsFrame = undefined;
	}
}
