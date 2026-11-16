import type * as ResvgWasm from '@resvg/resvg-wasm';
import fs from 'node:fs/promises';
import { createRequire } from 'node:module';
import url from 'node:url';

const BUNDLED_WASM_FILE = 'resvg.wasm';
const PACKAGE_WASM_FILE = '@resvg/resvg-wasm/index_bg.wasm';

async function readWasm(): Promise<Buffer> {
	try {
		return await fs.readFile(
			url.fileURLToPath(new URL(`./${BUNDLED_WASM_FILE}`, import.meta.url))
		);
	} catch {
		return fs.readFile(
			createRequire(import.meta.url).resolve(PACKAGE_WASM_FILE)
		);
	}
}

/**
 * Loads resvg compiled to WebAssembly and initializes it, which is only possible once per process.
 * The build copies the `.wasm` file next to the bundle; from sources it is read from the package.
 * A panic of the renderer then surfaces as a catchable error instead of aborting the process, as native resvg does.
 */
export async function loadResvgWasm(): Promise<typeof ResvgWasm> {
	const resvg = await import('@resvg/resvg-wasm');
	await resvg.initWasm(await readWasm());
	return resvg;
}
