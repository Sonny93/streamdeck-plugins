import { streamDeck } from '@elgato/streamdeck';

import type { CoverCache } from './cover_cache';

/**
 * Loads covers into a `CoverCache` in the background without ever rejecting.
 * A cover already loading is not requested again, and a cover that failed is not retried until `retryFailed` is called,
 * so that frames rendered at 30 per second do not hammer a failing download.
 */
export class CoverLoader {
	private readonly loading = new Set<string>();
	private readonly failed = new Set<string>();

	constructor(private readonly cache: Pick<CoverCache, 'get' | 'load'>) {}

	/** The cached data URL of a cover, `undefined` while it is not loaded. */
	get(url: string): string | undefined {
		return this.cache.get(url);
	}

	/** Allows the covers that failed to load to be requested again. */
	retryFailed(): void {
		this.failed.clear();
	}

	/** Loads the covers that are neither cached, loading nor failed; resolves to whether at least one was loaded. */
	async fetch(urls: readonly string[]): Promise<boolean> {
		const wanted = [...new Set(urls)];
		const pending = wanted.filter(
			(url) =>
				this.cache.get(url) === undefined &&
				!this.loading.has(url) &&
				!this.failed.has(url)
		);
		for (const url of pending) {
			this.loading.add(url);
		}
		const outcomes = await Promise.all(pending.map((url) => this.loadOne(url)));
		return outcomes.some(Boolean);
	}

	private async loadOne(url: string): Promise<boolean> {
		try {
			await this.cache.load(url);
			return true;
		} catch (error) {
			this.failed.add(url);
			streamDeck.logger.debug('Cannot load a playlist cover', error);
			return false;
		} finally {
			this.loading.delete(url);
		}
	}
}
