import { streamDeck } from '@elgato/streamdeck';

import type { LikeTargetRef } from '../spotify/like_target_ref';

type PresenceQuery = (
	options: Readonly<{ trackUri: string; target: LikeTargetRef }>
) => Promise<boolean>;

type PresenceTrackerOptions = Readonly<{
	query: PresenceQuery;
	onChange: (isInTarget: boolean) => void;
}>;

/**
 * Tracks whether the playing track is already in the like target.
 * Each refresh for a new track or target runs the query once; a result that arrives after a newer refresh is dropped.
 * No track, or a failing query (Spotify closed, for instance), counts as not in the target.
 */
export class LikePresenceTracker {
	private sequence = 0;
	private lastKey: string | undefined;
	private inTarget = false;

	constructor(private readonly options: PresenceTrackerOptions) {}

	/** Whether the playing track is known to be in the like target. */
	get isInTarget(): boolean {
		return this.inTarget;
	}

	/** Re-checks the presence when the track or the target differs from the last refresh. */
	async refresh(
		options: Readonly<{
			trackUri: string | undefined;
			target: LikeTargetRef;
		}>
	): Promise<void> {
		const key = JSON.stringify([
			options.trackUri,
			options.target.kind,
			options.target.uri,
		]);
		if (key === this.lastKey) {
			return;
		}
		this.lastKey = key;
		this.sequence += 1;
		const sequence = this.sequence;
		if (options.trackUri === undefined) {
			this.apply(false);
			return;
		}
		if (this.inTarget) {
			this.apply(false);
		}
		const isInTarget = await this.query({
			trackUri: options.trackUri,
			target: options.target,
		});
		if (sequence === this.sequence) {
			this.apply(isInTarget);
		}
	}

	/** Records that the playing track was just added, discarding any query still in flight. */
	markInTarget(): void {
		this.sequence += 1;
		this.apply(true);
	}

	private apply(isInTarget: boolean): void {
		this.inTarget = isInTarget;
		this.options.onChange(isInTarget);
	}

	private async query(
		options: Readonly<{ trackUri: string; target: LikeTargetRef }>
	): Promise<boolean> {
		try {
			return await this.options.query(options);
		} catch (error) {
			streamDeck.logger.debug(
				'Cannot check the liked state of the track',
				error
			);
			return false;
		}
	}
}
