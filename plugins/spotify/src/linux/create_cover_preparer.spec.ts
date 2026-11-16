import { describe, expect, it, vi } from 'vitest';

import { createCoverPreparer } from './create_cover_preparer';

const COVER = 'data:image/jpeg;base64,AQID';

describe('createCoverPreparer', () => {
	it('should return the cover as a PNG data url', async () => {
		const prepare = createCoverPreparer(() =>
			Promise.resolve(Buffer.from('png'))
		);

		expect(await prepare(COVER)).toBe(
			`data:image/png;base64,${Buffer.from('png').toString('base64')}`
		);
	});

	it('should embed the cover in a 256 px square document', async () => {
		const renderPng = vi.fn((_svg: string) =>
			Promise.resolve(Buffer.from('png'))
		);

		await createCoverPreparer(renderPng)(COVER);

		expect(renderPng.mock.calls[0]?.[0]).toContain(
			`width="256" height="256"><image width="256" height="256" preserveAspectRatio="xMidYMid slice" xlink:href="${COVER}"/>`
		);
	});

	it('should keep the downloaded cover when it cannot be shrunk', async () => {
		const prepare = createCoverPreparer(() =>
			Promise.reject(new Error('bad image'))
		);

		expect(await prepare(COVER)).toBe(COVER);
	});
});
