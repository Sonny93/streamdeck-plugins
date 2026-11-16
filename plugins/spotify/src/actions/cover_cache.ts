import { fetchCoverDataUrl } from '../spotify/fetch_cover_data_url';

/** In-memory cache of cover images as data URLs, keyed by their URL; concurrent loads of one URL share one download. */
export class CoverCache {
	constructor(
		private readonly fetchCover: (
			url: string
		) => Promise<string> = fetchCoverDataUrl
	) {}

	private readonly covers = new Map<string, string>();
	private readonly pending = new Map<string, Promise<string>>();

	/** The cached data URL of a cover, `undefined` while it is not loaded. */
	get(url: string): string | undefined {
		return this.covers.get(url);
	}

	/** Downloads the cover unless it is cached; rejects with `SpotifyCoverFetchError` when the download fails. */
	async load(url: string): Promise<void> {
		if (this.covers.has(url)) {
			return;
		}
		const request = this.pending.get(url) ?? this.fetchCover(url);
		this.pending.set(url, request);
		try {
			this.covers.set(url, await request);
		} finally {
			this.pending.delete(url);
		}
	}
}
