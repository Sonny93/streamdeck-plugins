import { describe, expect, it, vi } from 'vitest';

import { createPngRenderer } from './create_png_renderer';

const SANS_FONTS = { family: 'Liberation Sans', files: ['/fonts/a.ttf'] };
const FONT_BYTES = new Uint8Array([1, 2, 3]);

function buildFakeResvg() {
	const constructed: unknown[][] = [];
	const free = vi.fn();
	class FakeResvg {
		constructor(...args: unknown[]) {
			constructed.push(args);
		}
		render() {
			return { asPng: () => new Uint8Array([7, 8]), free };
		}
		free = free;
	}
	return { module: { Resvg: FakeResvg } as never, constructed, free };
}

function buildRenderer(
	overrides: Parameters<typeof createPngRenderer>[0] = {}
) {
	const resvg = buildFakeResvg();
	const render = createPngRenderer({
		loadResvg: () => Promise.resolve(resvg.module),
		resolveSansFonts: () => Promise.resolve(SANS_FONTS),
		findFallbackFontFiles: () => Promise.resolve([]),
		readFontFile: () => Promise.resolve(FONT_BYTES),
		...overrides,
	});
	return { render, resvg };
}

describe('createPngRenderer', () => {
	it('should return the PNG bytes of the rendered image', async () => {
		const { render } = buildRenderer();

		expect([...(await render('<svg/>'))]).toStrictEqual([7, 8]);
	});

	it('should load the Arial stand-in as the default font', async () => {
		const { render, resvg } = buildRenderer();

		await render('<svg/>');

		expect(resvg.constructed).toStrictEqual([
			[
				'<svg/>',
				{
					font: {
						fontBuffers: [FONT_BYTES],
						defaultFontFamily: 'Liberation Sans',
						sansSerifFamily: 'Liberation Sans',
					},
				},
			],
		]);
	});

	it('should add the fallback font files of unusual characters', async () => {
		const findFallbackFontFiles = vi.fn(() =>
			Promise.resolve(['/fonts/cjk.ttc'])
		);
		const readFontFile = vi.fn((_file: string) => Promise.resolve(FONT_BYTES));
		const { render } = buildRenderer({ findFallbackFontFiles, readFontFile });

		await render('<svg><text>夜</text></svg>');

		expect([
			findFallbackFontFiles.mock.calls[0],
			readFontFile.mock.calls.map(([file]) => file),
		]).toStrictEqual([[[0x591c]], ['/fonts/a.ttf', '/fonts/cjk.ttc']]);
	});

	it('should read each font file once', async () => {
		const readFontFile = vi.fn((_file: string) => Promise.resolve(FONT_BYTES));
		const { render } = buildRenderer({ readFontFile });

		await render('<svg/>');
		await render('<svg/>');

		expect(readFontFile).toHaveBeenCalledOnce();
	});

	it('should load resvg once', async () => {
		const loadResvg = vi.fn(() => Promise.resolve(buildFakeResvg().module));
		const { render } = buildRenderer({ loadResvg });

		await render('<svg/>');
		await render('<svg/>');

		expect(loadResvg).toHaveBeenCalledOnce();
	});

	it('should free the renderer and the image', async () => {
		const { render, resvg } = buildRenderer();

		await render('<svg/>');

		expect(resvg.free).toHaveBeenCalledTimes(2);
	});
});
