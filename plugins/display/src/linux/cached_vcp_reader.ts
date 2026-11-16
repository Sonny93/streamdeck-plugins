import { CommandFailedError } from 'deck-kit/process/command_failed_error';

import type { VcpReply } from '../displays/vcp_reply';

/**
 * Keeps what a monitor last said over DDC/CI and asks again only once the answer is older than the interval:
 * each `ddcutil` call costs a process and a slow bus exchange, so the polling of the hub must not reach it every time.
 * A monitor that does not answer (turned off) keeps its last answer until it speaks again, and is not asked again before the interval.
 */
export class CachedVcpReader {
	private readonly replies = new Map<number, VcpReply>();
	private fetchedAt: number | undefined;

	constructor(
		private readonly options: Readonly<{
			fetch: (
				codes: readonly number[]
			) => Promise<ReadonlyMap<number, VcpReply>>;
			now: () => number;
			/** How long an answer stays good, asked at each read; `Infinity` for one that never needs reading again. */
			refreshIntervalMilliseconds: () => number;
		}>
	) {}

	/** Reads one feature, fetching all the `codes` together when the cache is older than the interval. */
	async read(
		code: number,
		codes: readonly number[]
	): Promise<VcpReply | undefined> {
		if (this.isStale()) {
			await this.refresh(codes);
		}
		return this.replies.get(code);
	}

	/** Records a value just written, which counts as a fresh answer. */
	remember(code: number, reply: VcpReply): void {
		this.replies.set(code, reply);
		this.fetchedAt = this.options.now();
	}

	peek(code: number): VcpReply | undefined {
		return this.replies.get(code);
	}

	maximumOf(code: number): number | undefined {
		return this.replies.get(code)?.maximum;
	}

	private isStale(): boolean {
		return (
			this.fetchedAt === undefined ||
			this.options.now() - this.fetchedAt >=
				this.options.refreshIntervalMilliseconds()
		);
	}

	private async refresh(codes: readonly number[]): Promise<void> {
		this.fetchedAt = this.options.now();
		try {
			for (const [code, reply] of await this.options.fetch(codes)) {
				this.replies.set(code, reply);
			}
		} catch (error) {
			if (!(error instanceof CommandFailedError)) {
				throw error;
			}
		}
	}
}
