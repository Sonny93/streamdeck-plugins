import { describe, expect, it, vi } from 'vitest';

import { CoverLoader } from './cover_loader';

vi.mock('@elgato/streamdeck', () => ({
	streamDeck: { logger: { debug: vi.fn() } },
}));

const URL_A = 'https://i.scdn.co/image/a';
const URL_B = 'https://i.scdn.co/image/b';
const DATA_URL = 'data:image/jpeg;base64,AQID';

function buildLoader(load: (url: string) => Promise<void>) {
	const covers = new Map<string, string>();
	const loadMock = vi.fn(async (url: string) => {
		await load(url);
		covers.set(url, DATA_URL);
	});
	const loader = new CoverLoader({
		get: (url) => covers.get(url),
		load: loadMock,
	});
	return { loader, loadMock };
}

describe('CoverLoader', () => {
	it('should report that covers were loaded', async () => {
		const { loader } = buildLoader(() => Promise.resolve());

		expect(await loader.fetch([URL_A, URL_B])).toBe(true);
	});

	it('should give the loaded cover', async () => {
		const { loader } = buildLoader(() => Promise.resolve());

		await loader.fetch([URL_A]);

		expect(loader.get(URL_A)).toBe(DATA_URL);
	});

	it('should not load a cover that is already cached', async () => {
		const { loader, loadMock } = buildLoader(() => Promise.resolve());
		await loader.fetch([URL_A]);

		const loaded = await loader.fetch([URL_A]);

		expect(loaded).toBe(false);
		expect(loadMock).toHaveBeenCalledTimes(1);
	});

	it('should not load a cover that is already loading', async () => {
		let release: () => void = () => undefined;
		const gate = new Promise<void>((resolve) => {
			release = resolve;
		});
		const { loader, loadMock } = buildLoader(() => gate);
		const first = loader.fetch([URL_A]);

		const second = await loader.fetch([URL_A]);
		release();
		await first;

		expect(second).toBe(false);
		expect(loadMock).toHaveBeenCalledTimes(1);
	});

	it('should load a duplicated url once', async () => {
		const { loader, loadMock } = buildLoader(() => Promise.resolve());

		await loader.fetch([URL_A, URL_A]);

		expect(loadMock).toHaveBeenCalledTimes(1);
	});

	it('should not reject when a download fails', async () => {
		const { loader } = buildLoader(() => Promise.reject(new Error('offline')));

		expect(await loader.fetch([URL_A])).toBe(false);
	});

	it('should not retry a failed cover until asked to', async () => {
		const { loader, loadMock } = buildLoader(() =>
			Promise.reject(new Error('offline'))
		);
		await loader.fetch([URL_A]);

		await loader.fetch([URL_A]);
		expect(loadMock).toHaveBeenCalledTimes(1);

		loader.retryFailed();
		await loader.fetch([URL_A]);
		expect(loadMock).toHaveBeenCalledTimes(2);
	});
});
