import path from 'node:path';
import url from 'node:url';
import { defineConfig } from 'tsdown';
import type { Rolldown } from 'tsdown';

const SD_PLUGIN_DIRECTORY = 'com.sonny93.climate.sdPlugin';

/** Marks the bundle folder as ES modules, so Node loads `plugin.js` as one. */
function emitModulePackageFilePlugin(): Rolldown.Plugin {
	return {
		name: 'emit-module-package-file',
		generateBundle() {
			this.emitFile({
				fileName: 'package.json',
				source: '{ "type": "module" }',
				type: 'asset',
			});
		},
	};
}

export default defineConfig(({ watch = false }) => {
	const isWatching = watch !== false;
	return {
		entry: { plugin: 'src/plugin.ts' },
		outDir: `${SD_PLUGIN_DIRECTORY}/bin`,
		clean: true,
		format: 'esm',
		platform: 'node',
		target: 'node24',
		fixedExtension: false,
		deps: {
			alwaysBundle: [/^@elgato\//u, /^deck-kit\//u, /^zod(?:\/|$)/u],
			onlyBundle: false,
		},
		minify: !isWatching,
		sourcemap: isWatching,
		outputOptions: {
			// One file: hashed chunks would pile up in the bin folder and ship in the package.
			codeSplitting: false,
			sourcemapPathTransform: (relativeSourcePath, sourcemapPath) =>
				url.pathToFileURL(
					path.resolve(path.dirname(sourcemapPath), relativeSourcePath)
				).href,
		},
		watch: isWatching
			? [
					'src',
					'../../packages/deck-kit/src',
					`${SD_PLUGIN_DIRECTORY}/manifest.json`,
				]
			: false,
		onSuccess: isWatching ? 'pnpm run restart' : undefined,
		plugins: [emitModulePackageFilePlugin()],
	};
});
