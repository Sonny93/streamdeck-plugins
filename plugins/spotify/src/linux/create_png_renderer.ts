import type * as ResvgWasm from '@resvg/resvg-wasm';
import fs from 'node:fs/promises';

import { createFallbackFontFinder } from './find_fallback_font_files';
import { listFallbackCodePoints } from './list_fallback_code_points';
import { loadResvgWasm } from './load_resvg_wasm';
import { resolveSansFonts, type SansFonts } from './resolve_sans_fonts';

type PngRendererOptions = Readonly<{
	loadResvg?: () => Promise<typeof ResvgWasm>;
	resolveSansFonts?: () => Promise<SansFonts | undefined>;
	findFallbackFontFiles?: (codePoints: readonly number[]) => Promise<string[]>;
	readFontFile?: (file: string) => Promise<Uint8Array>;
}>;

/**
 * Builds the function that renders an SVG to a PNG at its own size, with resvg compiled to WebAssembly.
 * resvg, the Arial stand-in and every font file are loaded once, on first use; text beyond Latin (CJK, emoji) adds the font file fontconfig names for each character.
 * A render that fails (a resvg panic is a catchable error in WebAssembly) rejects with that error and leaves later renders working.
 */
export function createPngRenderer(
	options: PngRendererOptions = {}
): (svg: string) => Promise<Buffer> {
	const loadResvg = options.loadResvg ?? loadResvgWasm;
	const findSansFonts = options.resolveSansFonts ?? resolveSansFonts;
	const findFallbackFontFiles =
		options.findFallbackFontFiles ?? createFallbackFontFinder();
	const readFontFile = options.readFontFile ?? ((file) => fs.readFile(file));
	const fontBuffers = new Map<string, Promise<Uint8Array>>();
	let ready:
		| Promise<readonly [typeof ResvgWasm, SansFonts | undefined]>
		| undefined;

	function readFont(file: string): Promise<Uint8Array> {
		const known = fontBuffers.get(file) ?? readFontFile(file);
		fontBuffers.set(file, known);
		return known;
	}

	return async (svg) => {
		ready ??= Promise.all([loadResvg(), findSansFonts()]);
		const [resvg, sansFonts] = await ready;
		const fallbackFiles = await findFallbackFontFiles(
			listFallbackCodePoints(svg)
		);
		const files = [...(sansFonts?.files ?? []), ...fallbackFiles];
		const renderer = new resvg.Resvg(svg, {
			font: {
				fontBuffers: await Promise.all(
					[...new Set(files)].map((file) => readFont(file))
				),
				defaultFontFamily: sansFonts?.family,
				sansSerifFamily: sansFonts?.family,
			},
		});
		try {
			const image = renderer.render();
			try {
				return Buffer.from(image.asPng());
			} finally {
				image.free();
			}
		} finally {
			renderer.free();
		}
	};
}
