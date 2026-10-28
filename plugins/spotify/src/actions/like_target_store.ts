import { streamDeck } from '@elgato/streamdeck';

import type { LikeTarget } from './like_target';
import { likeTargetSettingsSchema } from './like_target_settings_schema';

type LikeTargetListener = (target: LikeTarget | undefined) => void;

/**
 * Holds the playlist that the "like" key adds tracks to, persisted in the Stream Deck global settings.
 * Invalid or missing settings mean there is no target. Listeners are notified whenever the target changes.
 */
export class LikeTargetStore {
	private readonly listeners = new Set<LikeTargetListener>();
	private target: LikeTarget | undefined;

	constructor() {
		streamDeck.settings.onDidReceiveGlobalSettings((ev) => {
			this.apply(ev.settings);
		});
	}

	/** The current like target, `undefined` while none is set or before `load` completes. */
	get current(): LikeTarget | undefined {
		return this.target;
	}

	/** Reads the global settings once and notifies the listeners. */
	async load(): Promise<void> {
		this.apply(await streamDeck.settings.getGlobalSettings());
	}

	/** Persists the target in the global settings, then makes it current and notifies the listeners. */
	async set(target: LikeTarget): Promise<void> {
		await streamDeck.settings.setGlobalSettings({ likeTarget: target });
		this.target = target;
		this.notify();
	}

	/** Registers a listener called on every change, and returns the function that unsubscribes it. */
	subscribe(listener: LikeTargetListener): () => void {
		this.listeners.add(listener);
		return () => {
			this.listeners.delete(listener);
		};
	}

	private apply(rawSettings: unknown): void {
		const parsed = likeTargetSettingsSchema.safeParse(rawSettings);
		this.target = parsed.success ? parsed.data.likeTarget : undefined;
		this.notify();
	}

	private notify(): void {
		for (const listener of this.listeners) {
			listener(this.target);
		}
	}
}
