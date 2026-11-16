import { describe, expect, it } from 'vitest';

import { createPngRenderer } from './create_png_renderer';

const PNG_SIGNATURE = '89504e47';
const GOOD_SVG =
	'<svg xmlns="http://www.w3.org/2000/svg" width="20" height="10"><rect width="20" height="10" fill="red"/></svg>';
const LAYER_OUTSIDE_CANVAS_SVG =
	'<svg xmlns="http://www.w3.org/2000/svg" width="200" height="100"><rect x="500" width="50" height="50" opacity="0.5" fill="red"/></svg>';

describe('the WebAssembly PNG renderer', () => {
	const render = createPngRenderer({
		resolveSansFonts: () => Promise.resolve(undefined),
	});

	it('should render an SVG to a PNG', async () => {
		const png = await render(GOOD_SVG);

		expect(png.subarray(0, 4).toString('hex')).toBe(PNG_SIGNATURE);
	});

	it('should throw instead of aborting the process on a layer outside the canvas, which crashes native resvg', async () => {
		await expect(render(LAYER_OUTSIDE_CANVAS_SVG)).rejects.toThrow();
	});

	it('should keep rendering after such a failure', async () => {
		await render(LAYER_OUTSIDE_CANVAS_SVG).catch(() => undefined);

		expect((await render(GOOD_SVG)).subarray(0, 4).toString('hex')).toBe(
			PNG_SIGNATURE
		);
	});
});
