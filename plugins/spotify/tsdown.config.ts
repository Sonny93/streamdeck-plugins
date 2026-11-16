import { copyLanguageInspector } from 'deck-kit/inspector/copy_language_inspector';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import url from 'node:url';
import { defineConfig } from 'tsdown';
import type { Rolldown } from 'tsdown';

const SD_PLUGIN_DIRECTORY = 'com.sonny93.spotify.sdPlugin';
const BUNDLED_NODE_MODULES = `${SD_PLUGIN_DIRECTORY}/bin/node_modules`;
const KOFFI_PACKAGE = 'koffi';
const RESVG_WASM_PACKAGE = '@resvg/resvg-wasm';
const RESVG_WASM_FILE = 'index_bg.wasm';
const BUNDLED_RESVG_WASM = `${SD_PLUGIN_DIRECTORY}/bin/resvg.wasm`;
const NATIVE_PACKAGES = [
	{ name: KOFFI_PACKAGE, nativeName: '@koromix/koffi-win32-x64' },
] as const;
const KOFFI_SKIPPED_DIRECTORIES = new Set(['doc', 'vendor', 'lib']);
const KOFFI_SKIPPED_EXTENSIONS = new Set([
	'.cc',
	'.hh',
	'.inc',
	'.c',
	'.h',
	'.S',
	'.lib',
	'.md',
]);

/**
 * Tells whether a file of a native package is needed at runtime.
 * Documentation, vendored headers and C sources are left out.
 */
function isNativeRuntimeFile(
	packageDirectory: string,
	source: string
): boolean {
	const relativePath = path.relative(packageDirectory, source);
	const [firstSegment = ''] = relativePath.split(path.sep);
	if (KOFFI_SKIPPED_DIRECTORIES.has(firstSegment)) {
		return false;
	}
	if (path.basename(source) === 'CMakeLists.txt') {
		return false;
	}
	return !KOFFI_SKIPPED_EXTENSIONS.has(path.extname(source));
}

function readPackageVersion(directory: string): unknown {
	try {
		const packageJson: unknown = JSON.parse(
			fs.readFileSync(path.join(directory, 'package.json'), 'utf8')
		);
		return typeof packageJson === 'object' && packageJson !== null
			? Reflect.get(packageJson, 'version')
			: undefined;
	} catch {
		return undefined;
	}
}

/**
 * Copies a package, dereferencing pnpm symlinks, unless the same version is already in place.
 * The skip matters because a running plugin keeps the native addon loaded, and Windows refuses to overwrite it.
 */
function copyPackageOnce(source: string, destination: string): void {
	if (readPackageVersion(source) === readPackageVersion(destination)) {
		return;
	}
	fs.rmSync(destination, { recursive: true, force: true });
	fs.cpSync(source, destination, {
		recursive: true,
		dereference: true,
		filter: (entry) => isNativeRuntimeFile(source, entry),
	});
}

/**
 * The native addon koffi (Windows) is kept external and shipped next to the bundle:
 * its loader expects the platform package next to it, at ../../../<scope>/<package> from its own folder.
 */
function copyNativePackagesPlugin(): Rolldown.Plugin {
	return {
		name: 'copy-native-packages',
		writeBundle() {
			for (const { name, nativeName } of NATIVE_PACKAGES) {
				const packageDirectory = fs.realpathSync(
					path.join(import.meta.dirname, 'node_modules', name)
				);
				const nativeDirectory = path.dirname(
					fs.realpathSync(
						createRequire(path.join(packageDirectory, 'package.json')).resolve(
							`${nativeName}/package.json`
						)
					)
				);
				copyPackageOnce(
					packageDirectory,
					path.join(BUNDLED_NODE_MODULES, name)
				);
				copyPackageOnce(
					nativeDirectory,
					path.join(BUNDLED_NODE_MODULES, nativeName)
				);
			}
		},
	};
}

/** Ships the resvg WebAssembly file next to the bundle, where the Linux host reads it. */
function copyResvgWasmPlugin(): Rolldown.Plugin {
	return {
		name: 'copy-resvg-wasm',
		writeBundle() {
			fs.copyFileSync(
				path.join(
					import.meta.dirname,
					'node_modules',
					RESVG_WASM_PACKAGE,
					RESVG_WASM_FILE
				),
				BUNDLED_RESVG_WASM
			);
		},
	};
}

/** Ships the browser script of the language select, which deck-kit owns, next to the bundle. */
function copyLanguageInspectorPlugin(): Rolldown.Plugin {
	return {
		name: 'copy-language-inspector',
		writeBundle() {
			copyLanguageInspector(`${SD_PLUGIN_DIRECTORY}/bin`);
		},
	};
}

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
		// The bin folder also holds the copied koffi packages, which a running plugin keeps locked.
		clean: false,
		format: 'esm',
		platform: 'node',
		target: 'node24',
		fixedExtension: false,
		deps: {
			neverBundle: [KOFFI_PACKAGE],
			alwaysBundle: [
				/^@elgato\//u,
				/^@resvg\//u,
				/^deck-kit\//u,
				/^zod(?:\/|$)/u,
			],
			onlyBundle: false,
		},
		minify: !isWatching,
		sourcemap: isWatching,
		outputOptions: {
			// One file: hashed chunks would pile up in the bin folder, which is never cleaned, and ship in the package.
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
		plugins: [
			emitModulePackageFilePlugin(),
			copyNativePackagesPlugin(),
			copyResvgWasmPlugin(),
			copyLanguageInspectorPlugin(),
		],
	};
});
