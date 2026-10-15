import { toSvgDataUrl } from './to_svg_data_url';
import { ProgressTicker } from './progress_ticker';
import { NowPlayingTiming } from './now_playing_timing';
import type { NowPlayingDial } from './now_playing_dial';
import { NowPlayingMetrics } from './now_playing_metrics';
import type { NowPlayingFrame } from './now_playing_frame';
import { buildNowPlayingSvg } from './build_now_playing_svg';
import { resolvePlaybackPosition } from './resolve_playback_position';
import type { NowPlayingScreenOptions } from './now_playing_screen_options';

const CANVAS_FEEDBACK_KEY = 'canvas';

type LoadedCover = Readonly<{ url: string; dataUrl: string | undefined }>;

/**
 * Shows the playing track (cover, title, artists, progress) across the whole touch strip while the Stream Deck is inactive.
 * Every dial of the plugin attaches itself and draws the slice of its column; a column without a dial of the plugin stays as it is.
 * It shows only while a track is loaded, redraws on every player change and, while playing, every second for the progress bar.
 * Only the cover of the current track is kept; it is downloaded as soon as the track is known, and not retried when it fails.
 */
export class NowPlayingScreen {
	private readonly dials = new Map<string, NowPlayingDial>();
	private readonly hiddenListeners = new Set<() => void>();
	private readonly ticker: ProgressTicker;
	private showing = false;
	private cover: LoadedCover | undefined;
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

	/** Records an interaction on a dial; returns whether the screen was showing, i.e. the interaction only woke the dials. */
	wake(): boolean {
		const wasShowing = this.showing;
		this.options.inactivity.recordActivity();
		return wasShowing;
	}

	/** Draws the playing track on every attached dial; does nothing while the screen is not showing. */
	async render(): Promise<void> {
		const frame = this.buildFrame();
		if (!this.showing || frame === undefined) {
			return;
		}
		await Promise.all(
			[...this.dials.values()].map((dial) =>
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
		this.showing = false;
	}

	private buildFrame(): NowPlayingFrame | undefined {
		const state = this.options.playerStateHub.current;
		const track = state?.track;
		if (track === undefined) {
			return undefined;
		}
		const isPaused = state?.isPaused ?? true;
		return {
			title: track.title,
			artistNames: track.artistNames,
			coverDataUrl: this.readCover(track.imageUrl),
			positionMilliseconds: resolvePlaybackPosition({
				track,
				isPaused,
				now: this.options.now(),
			}),
			durationMilliseconds: track.durationMilliseconds,
			isPaused,
		};
	}

	private update(): void {
		const state = this.options.playerStateHub.current;
		this.readCover(state?.track?.imageUrl);
		const wasShowing = this.showing;
		this.showing =
			this.options.inactivity.isInactive && state?.track !== undefined;
		if (this.showing) {
			this.ticker.restart(state?.isPaused === false);
			this.renderInBackground();
			return;
		}
		this.ticker.stop();
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
			await this.render();
		} catch (error) {
			this.options.onError(error);
		}
	}
}
