import { toSvgDataUrl } from '../text/to_svg_data_url';
import type { IdleDial } from './idle_dial';
import type { IdlePanelOptions } from './idle_panel_options';
import { IdleTiming } from './idle_timing';
import { WakeGate } from './wake_gate';
import type { WakeGesture } from './wake_gesture';

const DEFAULT_FEEDBACK_KEY = 'canvas';

function encodeAsDataUrl(svg: string): Promise<string | undefined> {
	return Promise.resolve(toSvgDataUrl(svg));
}

/**
 * Shows one panel across the whole touch strip while the Stream Deck is inactive.
 * Every dial of the plugin attaches itself and draws the slice of its column; a column without a dial of the plugin stays as it is.
 * It shows only while the plugin says its content is available, and draws again whenever that content changes.
 * It follows the inactivity monitor and the content only while a dial is attached.
 * A page that opens counts as activity: the panel shows only after the full delay spent on that page without touching a dial.
 * While the panel shows, a gesture on a dial only wakes the dials (`wake`), however long it lasts: see `WakeGate`.
 */
export class IdlePanel {
	private readonly dials = new Map<string, IdleDial>();
	/** The slice last sent to each dial, or being sent; a dial missing here has nothing to compare with. */
	private readonly sentSlices = new Map<string, string>();
	private readonly shownListeners = new Set<() => void>();
	private readonly hiddenListeners = new Set<() => void>();
	private readonly wakeGate: WakeGate;
	private unsubscribes: (() => void)[] | undefined;
	private wasShowing = false;

	constructor(private readonly options: IdlePanelOptions) {
		this.wakeGate = new WakeGate({
			schedule: options.schedule,
			quietMilliseconds:
				options.wakeQuietMilliseconds ?? IdleTiming.wakeQuietMilliseconds,
		});
	}

	/** Whether the dials currently show the panel instead of their own content. */
	get isShowing(): boolean {
		return (
			this.dials.size > 0 &&
			this.options.inactivity.isInactive &&
			this.options.isAvailable()
		);
	}

	/** Adds a dial that appeared (or replaces it when it moved); the first dial starts the panel and restarts the inactivity delay. */
	attach(dial: IdleDial): void {
		if (this.dials.size === 0) {
			this.options.inactivity.recordActivity();
		}
		this.dials.set(dial.id, dial);
		this.sentSlices.delete(dial.id);
		this.start();
		this.update();
	}

	/** Removes a dial that disappeared; the last one stops the panel. */
	detach(dialId: string): void {
		this.dials.delete(dialId);
		this.sentSlices.delete(dialId);
		if (this.dials.size === 0) {
			this.stop();
		}
	}

	/** Registers what to do when the panel takes the strip over, e.g. drop a pending choice; returns the function that unsubscribes it. */
	onShown(listener: () => void): () => void {
		this.shownListeners.add(listener);
		return () => {
			this.shownListeners.delete(listener);
		};
	}

	/** Registers what to do when the panel goes away, i.e. draw the dial's own content again; returns the function that unsubscribes it. */
	onHidden(listener: () => void): () => void {
		this.hiddenListeners.add(listener);
		return () => {
			this.hiddenListeners.delete(listener);
		};
	}

	/** Records an interaction on a dial; returns whether the event must be swallowed because it only wakes the dials. */
	wake(gesture: WakeGesture = 'other'): boolean {
		const wasShowing = this.isShowing;
		this.options.inactivity.recordActivity();
		return this.wakeGate.swallow(gesture, wasShowing);
	}

	private start(): void {
		this.unsubscribes ??= [
			this.options.inactivity.subscribe(() => {
				this.update();
			}),
			this.options.subscribe(() => {
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
		this.sentSlices.clear();
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
			this.sentSlices.clear();
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
		await Promise.all(
			[...this.dials.values()].map((dial) => this.renderDial(dial))
		);
	}

	private async renderDial(dial: IdleDial): Promise<void> {
		const slice = this.options.buildSlice(dial.column);
		if (this.sentSlices.get(dial.id) === slice) {
			return;
		}
		this.sentSlices.set(dial.id, slice);
		const encode = this.options.encodeSlice ?? encodeAsDataUrl;
		const image = await encode(slice);
		if (this.sentSlices.get(dial.id) !== slice) {
			return;
		}
		if (image === undefined) {
			this.sentSlices.delete(dial.id);
			return;
		}
		await dial.setFeedback({
			[this.options.feedbackKey ?? DEFAULT_FEEDBACK_KEY]: image,
		});
	}
}
