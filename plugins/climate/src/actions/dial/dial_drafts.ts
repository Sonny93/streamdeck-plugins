import type { Scheduler } from 'deck-kit/async/scheduler';

import type { UnitMode, UnitState } from '../../daikin/unit_types';
import type { DialDraft } from './dial_draft';
import { moveDraft } from './move_draft';

export type DialDraftsOptions = Readonly<{
	schedule: Scheduler;
	/** How long a dial must stay down for the press to cancel the draft instead of applying it. */
	holdMilliseconds: number;
	/** How long a draft lives without a rotation. */
	idleMilliseconds: number;
	/** Called when a timer changes what a strip shows, so it can be drawn again. It must not throw. */
	onChange: () => void;
}>;

type KeptDraft = Readonly<{ draft: DialDraft; cancelIdle: () => void }>;
type Hold = { readonly cancel: () => void; hasFired: boolean };

/**
 * The target temperatures chosen with the dials and not applied yet, one per dial.
 * A rotation starts or moves a draft; a short press validates it; a long press, a rotation pause, a mode change
 * or the disappearance of the dial discards it.
 */
export class DialDrafts {
	private readonly drafts = new Map<string, KeptDraft>();
	private readonly holds = new Map<string, Hold>();

	constructor(private readonly options: DialDraftsOptions) {}

	/** The temperature chosen on a dial, `undefined` when there is none or it was chosen for another mode than the displayed one. */
	read(dialId: string, displayedMode: UnitMode): number | undefined {
		const kept = this.drafts.get(dialId);
		if (kept === undefined) {
			return undefined;
		}
		if (kept.draft.mode !== displayedMode) {
			this.drop(dialId);
			return undefined;
		}
		return kept.draft.temperature;
	}

	/** Moves the draft of a dial by the ticks, starting it from the displayed target, and restarts its idle timer. */
	rotate(
		options: Readonly<{
			dialId: string;
			state: UnitState;
			ticks: number;
			step: number;
		}>
	): void {
		const { dialId, state, ticks, step } = options;
		const draft = moveDraft({
			draft: this.drafts.get(dialId)?.draft,
			state,
			ticks,
			step,
		});
		this.drop(dialId);
		if (draft !== undefined) {
			this.drafts.set(dialId, {
				draft,
				cancelIdle: this.options.schedule(() => {
					this.discard(dialId);
				}, this.options.idleMilliseconds),
			});
		}
		this.options.onChange();
	}

	/** Starts the hold timer of a dial that went down: when it fires the draft is discarded while the dial is still held. */
	press(dialId: string): void {
		this.holds.get(dialId)?.cancel();
		const hold: Hold = {
			cancel: this.options.schedule(() => {
				hold.hasFired = true;
				this.discard(dialId);
			}, this.options.holdMilliseconds),
			hasFired: false,
		};
		this.holds.set(dialId, hold);
	}

	/**
	 * Ends a press. Returns the temperature to apply when it was a short press with a draft,
	 * and clears that draft; a press that was held long enough, or without draft, returns nothing.
	 */
	release(dialId: string): number | undefined {
		const hold = this.holds.get(dialId);
		this.holds.delete(dialId);
		hold?.cancel();
		const kept = this.drafts.get(dialId);
		if (hold === undefined || hold.hasFired || kept === undefined) {
			return undefined;
		}
		this.drop(dialId);
		return kept.draft.temperature;
	}

	/** Discards the draft of a dial and tells the strip to be drawn again. */
	discard(dialId: string): void {
		if (!this.drafts.has(dialId)) {
			return;
		}
		this.drop(dialId);
		this.options.onChange();
	}

	/** Discards the draft of every dial, e.g. when the idle dashboard takes the strip over. */
	discardAll(): void {
		for (const dialId of this.drafts.keys()) {
			this.discard(dialId);
		}
	}

	/** Forgets everything about a dial that disappears. */
	forget(dialId: string): void {
		this.drop(dialId);
		this.holds.get(dialId)?.cancel();
		this.holds.delete(dialId);
	}

	private drop(dialId: string): void {
		this.drafts.get(dialId)?.cancelIdle();
		this.drafts.delete(dialId);
	}
}
