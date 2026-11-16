import { toSvgDataUrl } from '../text/to_svg_data_url';
import type { IdlePanel } from './idle_panel';
import { resolveStripColumn } from './resolve_strip_column';
import type { WakeGesture } from './wake_gesture';

const DEFAULT_FEEDBACK_KEY = 'canvas';

/** A dial of the plugin, as much of the Stream Deck SDK object as the surface needs. */
export type StripDialHandle = Readonly<{
	id: string;
	coordinates: Readonly<{ column: number }> | undefined;
	setFeedback: (feedback: Readonly<Record<string, string>>) => Promise<unknown>;
}>;

export type StripDialSurfaceOptions = Readonly<{
	idle: Pick<
		IdlePanel,
		'attach' | 'detach' | 'onHidden' | 'isShowing' | 'wake'
	>;
	/** Called when the idle panel goes away, so the owner draws its dials again; it must not throw. */
	redraw: () => void;
	/** Turns the SVG of a dial into the image sent to it (the SVG data URL by default, `undefined` keeps the image shown). */
	encode?: (svg: string) => Promise<string | undefined>;
	/** The key of the pixmap item of the dial layout, `canvas` by default. */
	feedbackKey?: string;
}>;

function encodeAsDataUrl(svg: string): Promise<string | undefined> {
	return Promise.resolve(toSvgDataUrl(svg));
}

/**
 * What a plugin action that owns strip dials holds to take part in the idle panel; it is composed into the action, not inherited.
 * It attaches each dial to the idle panel while it is visible, draws nothing while the panel shows,
 * sends a picture only when it differs from the last one sent to that dial, and draws again when the panel goes away.
 */
export class StripDialSurface {
	/** The picture last sent to each dial, or being sent. */
	private readonly sentPictures = new Map<string, string>();

	constructor(private readonly options: StripDialSurfaceOptions) {
		options.idle.onHidden(() => {
			this.sentPictures.clear();
			options.redraw();
		});
	}

	/** Whether the idle panel shows, so the dials draw nothing of their own. */
	get isIdleShowing(): boolean {
		return this.options.idle.isShowing;
	}

	/** The slot of the touch strip a dial draws. */
	columnOf(dial: Pick<StripDialHandle, 'coordinates'>): number {
		return resolveStripColumn(dial.coordinates);
	}

	/** Attaches a dial that appeared to the idle panel. */
	appear(dial: StripDialHandle): void {
		this.options.idle.attach({
			id: dial.id,
			column: this.columnOf(dial),
			setFeedback: async (feedback) => {
				await dial.setFeedback(feedback);
			},
		});
	}

	/** Forgets a dial that disappeared. */
	disappear(dialId: string): void {
		this.sentPictures.delete(dialId);
		this.options.idle.detach(dialId);
	}

	/** Records an interaction; returns whether the event must be swallowed because it only wakes the dials. */
	consumeWake(gesture: WakeGesture = 'other'): boolean {
		return this.options.idle.wake(gesture);
	}

	/** Draws a dial with the picture of its column, unless the idle panel shows or the picture is the one already sent. */
	async draw(
		dial: StripDialHandle,
		buildPicture: (column: number) => string
	): Promise<void> {
		if (this.options.idle.isShowing) {
			return;
		}
		const picture = buildPicture(this.columnOf(dial));
		if (this.sentPictures.get(dial.id) === picture) {
			return;
		}
		this.sentPictures.set(dial.id, picture);
		const encode = this.options.encode ?? encodeAsDataUrl;
		const image = await encode(picture);
		if (this.sentPictures.get(dial.id) !== picture) {
			return;
		}
		if (image === undefined) {
			this.sentPictures.delete(dial.id);
			return;
		}
		await dial.setFeedback({
			[this.options.feedbackKey ?? DEFAULT_FEEDBACK_KEY]: image,
		});
	}
}
