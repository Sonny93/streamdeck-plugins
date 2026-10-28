import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CoverCache } from './cover_cache';
import { fetchCoverDataUrl } from '../spotify/fetch_cover_data_url';

vi.mock('../spotify/fetch_cover_data_url');

const URL_A = 'https://i.scdn.co/image/a';
const DATA_URL_A = 'data:image/jpeg;base64,AQID';

describe('CoverCache', () => {
	beforeEach(() => {
		vi.mocked(fetchCoverDataUrl).mockReset();
		vi.mocked(fetchCoverDataUrl).mockResolvedValue(DATA_URL_A);
	});

	it('should have no cover before it is loaded', () => {
		expect(new CoverCache().get(URL_A)).toBeUndefined();
	});

	it('should return the data url once the cover is loaded', async () => {
		const cache = new CoverCache();

		await cache.load(URL_A);

		expect(cache.get(URL_A)).toBe(DATA_URL_A);
	});

	it('should download once for two concurrent loads of the same url', async () => {
		const cache = new CoverCache();

		await Promise.all([cache.load(URL_A), cache.load(URL_A)]);

		expect(fetchCoverDataUrl).toHaveBeenCalledTimes(1);
	});

	it('should not download again a cover that is cached', async () => {
		const cache = new CoverCache();
		await cache.load(URL_A);

		await cache.load(URL_A);

		expect(fetchCoverDataUrl).toHaveBeenCalledTimes(1);
	});

	it('should download each url separately', async () => {
		const cache = new CoverCache();

		await Promise.all([cache.load(URL_A), cache.load(`${URL_A}b`)]);

		expect(fetchCoverDataUrl).toHaveBeenCalledTimes(2);
	});

	it('should reject when the download fails', async () => {
		vi.mocked(fetchCoverDataUrl).mockRejectedValue(new Error('offline'));
		const cache = new CoverCache();

		await expect(cache.load(URL_A)).rejects.toThrow('offline');
	});

	it('should retry the download after a failure', async () => {
		vi.mocked(fetchCoverDataUrl).mockRejectedValueOnce(new Error('offline'));
		const cache = new CoverCache();
		await cache.load(URL_A).catch(() => undefined);

		await cache.load(URL_A);

		expect(cache.get(URL_A)).toBe(DATA_URL_A);
	});
});
