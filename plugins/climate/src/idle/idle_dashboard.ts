import { toSvgDataUrl } from 'deck-kit/text/to_svg_data_url';

import { buildDashboardSvg } from './build_dashboard_svg';
import type { IdleDashboardOptions } from './idle_dashboard_options';
import type { IdleDial } from './idle_dial';

const CANVAS_FEEDBACK_KEY = 'canvas';

/**
 * Shows the state of the air conditioner across the whole touch strip while the Stream Deck is inactive.
 * Every dial of the plugin attaches itself and draws the slice of its column; a column without a dial of the plugin stays as it is.
 * It shows only while the unit is ready, and redraws on every change of the view.
 * The first interaction on a dial only wakes the dials (`wake`): the caller must then do nothing else.
 */
export class IdleDashboard {
	private readonly dials = new Map<string, IdleDial>();
	private readonly lastImages = new Map<string, string>();
	private readonly shownListeners = new Set<() => void>();
	private readonly hiddenListeners = new Set<() => void>();
	private unsubscribes: (() => void)[] | undefined;
	private wasShowing = false;

	constructor(private readonly options: IdleDashboardOptions) {}

	/** Whether the dials currently show the dashboard instead of their own content. */
	get isShowing(): boolean {
		return (
			this.dials.size > 0 &&
			this.options.inactivity.isInactive &&
			this.options.hub.view.status === 'ready'
		);
	}

	/** Adds a dial that appeared (or replaces it when it moved); the first dial starts the dashboard. */
	attach(dial: IdleDial): void {
		this.dials.set(dial.id, dial);
		this.lastImages.delete(dial.id);
		this.start();
		this.update();
	}

	/** Removes a dial that disappeared; the last one stops the dashboard. */
	detach(dialId: string): void {
		this.dials.delete(dialId);
		this.lastImages.delete(dialId);
		if (this.dials.size === 0) {
			this.stop();
		}
	}

	/** Registers what to do when the dashboard takes the strip over, e.g. drop a pending draft; returns the function that unsubscribes it. */
	onShown(listener: () => void): () => void {
		this.shownListeners.add(listener);
		return () => {
			this.shownListeners.delete(listener);
		};
	}

	/** Registers what to do when the dashboard goes away, i.e. draw the dial's own content again; returns the function that unsubscribes it. */
	onHidden(listener: () => void): () => void {
		this.hiddenListeners.add(listener);
		return () => {
			this.hiddenListeners.delete(listener);
		};
	}

	/** Records an interaction on a dial; returns whether the dashboard was showing, i.e. the interaction only woke the dials. */
	wake(): boolean {
		const wasShowing = this.isShowing;
		this.options.inactivity.recordActivity();
		return wasShowing;
	}

	private start(): void {
		this.unsubscribes ??= [
			this.options.inactivity.subscribe(() => {
				this.update();
			}),
			this.options.hub.subscribe(() => {
				this.update();
			}),
		];
	}

	private stop(): void {
		for (const unsubscribe of this.unsubscribes ?? []) {
			unsubscribe();
		}
		this.unsubscribes = undefined;
		this.wasShowing = false;
		this.lastImages.clear();
	}

	/** Called by timers and listeners, so it never throws. */
	private update(): void {
		try {
			this.applyState();
		} catch (error) {
			this.options.onError(error);
		}
	}

	private applyState(): void {
		const isShowing = this.isShowing;
		const wasShowing = this.wasShowing;
		this.wasShowing = isShowing;
		if (isShowing) {
			if (!wasShowing) {
				this.notify(this.shownListeners);
			}
			this.renderInBackground();
			return;
		}
		if (wasShowing) {
			this.lastImages.clear();
			this.notify(this.hiddenListeners);
		}
	}

	private notify(listeners: ReadonlySet<() => void>): void {
		for (const listener of listeners) {
			listener();
		}
	}

	private renderInBackground(): void {
		this.render().catch(this.options.onError);
	}

	private async render(): Promise<void> {
		const { view } = this.options.hub;
		await Promise.all(
			[...this.dials.values()].map(async (dial) => {
				const image = toSvgDataUrl(buildDashboardSvg(view, dial.column));
				if (this.lastImages.get(dial.id) === image) {
					return;
				}
				this.lastImages.set(dial.id, image);
				await dial.setFeedback({ [CANVAS_FEEDBACK_KEY]: image });
			})
		);
	}
}
