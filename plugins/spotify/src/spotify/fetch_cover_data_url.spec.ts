import { afterEach, describe, expect, it, vi } from 'vitest';

import { fetchCoverDataUrl } from './fetch_cover_data_url';
import { SpotifyCoverFetchError } from './spotify_cover_fetch_error';

const COVER_URL = 'https://i.scdn.co/image/abc';

function stubFetch(response: Response | Error): void {
	vi.stubGlobal(
		'fetch',
		vi.fn(() =>
			response instanceof Error
				? Promise.reject(response)
				: Promise.resolve(response)
		)
	);
}

function buildImageResponse(contentType: string, status = 200): Response {
	return new Response(Uint8Array.from([1, 2, 3]), {
		status,
		headers: { 'content-type': contentType },
	});
}

describe('fetchCoverDataUrl', () => {
	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('should return the image as a base64 data url', async () => {
		stubFetch(buildImageResponse('image/jpeg'));

		await expect(fetchCoverDataUrl(COVER_URL)).resolves.toBe(
			'data:image/jpeg;base64,AQID'
		);
	});

	it('should ignore the parameters of the content type', async () => {
		stubFetch(buildImageResponse('image/png; charset=binary'));

		await expect(fetchCoverDataUrl(COVER_URL)).resolves.toBe(
			'data:image/png;base64,AQID'
		);
	});

	it('should throw a cover fetch error when the response is not ok', async () => {
		stubFetch(buildImageResponse('image/jpeg', 404));

		await expect(fetchCoverDataUrl(COVER_URL)).rejects.toThrow(
			SpotifyCoverFetchError
		);
	});

	it('should throw a cover fetch error when the content is not an image', async () => {
		stubFetch(buildImageResponse('text/html'));

		await expect(fetchCoverDataUrl(COVER_URL)).rejects.toThrow(
			SpotifyCoverFetchError
		);
	});

	it('should throw a cover fetch error when there is no content type', async () => {
		stubFetch(new Response(null));

		await expect(fetchCoverDataUrl(COVER_URL)).rejects.toThrow(
			SpotifyCoverFetchError
		);
	});

	it('should throw a cover fetch error when the request fails', async () => {
		stubFetch(new TypeError('network down'));

		await expect(fetchCoverDataUrl(COVER_URL)).rejects.toThrow(
			SpotifyCoverFetchError
		);
	});

	it('should name the url in the error', async () => {
		stubFetch(buildImageResponse('image/jpeg', 500));

		await expect(fetchCoverDataUrl(COVER_URL)).rejects.toThrow(COVER_URL);
	});
});
