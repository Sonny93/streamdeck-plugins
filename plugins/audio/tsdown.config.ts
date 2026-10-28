import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import url from 'node:url';
import { defineConfig } from 'tsdown';
import type { Rolldown } from 'tsdown';

const SD_PLUGIN_DIRECTORY = 'com.sonny93.audio.sdPlugin';
const BUNDLED_NODE_MODULES = `${SD_PLUGIN_DIRECTORY}/bin/node_modules`;
const KOFFI_PACKAGE = 'koffi';
const KOFFI_NATIVE_PACKAGE = '@koromix/koffi-win32-x64';
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
 * Tells whether a file of the koffi packages is needed at runtime.
 * Documentation, vendored headers and C sources are left out.
 */
function isKoffiRuntimeFile(packageDirectory: string, source: string): boolean {
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
		filter: (entry) => isKoffiRuntimeFile(source, entry),
	});
}

/**
 * koffi is a native addon, so it is kept external and shipped next to the bundle.
 * The loader of koffi expects its platform package at ../../../@koromix/koffi-<platform> from its own folder.
 */
function copyKoffiPlugin(): Rolldown.Plugin {
	return {
		name: 'copy-koffi',
		writeBundle() {
			const koffiDirectory = fs.realpathSync(
				path.join(import.meta.dirname, 'node_modules', KOFFI_PACKAGE)
			);
			const nativeDirectory = path.dirname(
				fs.realpathSync(
					createRequire(path.join(koffiDirectory, 'package.json')).resolve(
						`${KOFFI_NATIVE_PACKAGE}/package.json`
					)
				)
			);
			copyPackageOnce(
				koffiDirectory,
				path.join(BUNDLED_NODE_MODULES, KOFFI_PACKAGE)
			);
			copyPackageOnce(
				nativeDirectory,
				path.join(BUNDLED_NODE_MODULES, KOFFI_NATIVE_PACKAGE)
			);
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
			alwaysBundle: [/^@elgato\//u, /^zod(?:\/|$)/u],
			onlyBundle: false,
		},
		minify: !isWatching,
		sourcemap: isWatching,
		outputOptions: {
			sourcemapPathTransform: (relativeSourcePath, sourcemapPath) =>
				url.pathToFileURL(
					path.resolve(path.dirname(sourcemapPath), relativeSourcePath)
				).href,
		},
		watch: isWatching ? ['src', `${SD_PLUGIN_DIRECTORY}/manifest.json`] : false,
		onSuccess: isWatching ? 'pnpm run restart' : undefined,
		plugins: [emitModulePackageFilePlugin(), copyKoffiPlugin()],
	};
});
