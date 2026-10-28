import commonjs from '@rollup/plugin-commonjs';
import nodeResolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import typescript from '@rollup/plugin-typescript';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import url from 'node:url';

const isWatching = Boolean(process.env.ROLLUP_WATCH);
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
 * @param {string} packageDirectory
 * @param {string} source
 */
function isKoffiRuntimeFile(packageDirectory, source) {
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

/**
 * @param {string} directory
 * @returns {string | undefined}
 */
function readPackageVersion(directory) {
	try {
		return JSON.parse(
			fs.readFileSync(path.join(directory, 'package.json'), 'utf8')
		).version;
	} catch {
		return undefined;
	}
}

/**
 * Copies a package, dereferencing pnpm symlinks, unless the same version is already in place.
 * The skip matters because a running plugin keeps the native addon loaded, and Windows refuses to overwrite it.
 * @param {string} source real directory of the package
 * @param {string} destination
 */
function copyPackageOnce(source, destination) {
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
function copyKoffiPlugin() {
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

/** @type {import('rollup').RollupOptions} */
const config = {
	input: 'src/plugin.ts',
	external: [KOFFI_PACKAGE],
	output: {
		file: `${SD_PLUGIN_DIRECTORY}/bin/plugin.js`,
		sourcemap: isWatching,
		sourcemapPathTransform: (relativeSourcePath, sourcemapPath) =>
			url.pathToFileURL(
				path.resolve(path.dirname(sourcemapPath), relativeSourcePath)
			).href,
	},
	plugins: [
		{
			name: 'watch-externals',
			buildStart() {
				this.addWatchFile(`${SD_PLUGIN_DIRECTORY}/manifest.json`);
			},
		},
		typescript({ mapRoot: isWatching ? './' : undefined }),
		nodeResolve({
			browser: false,
			exportConditions: ['node'],
			preferBuiltins: true,
		}),
		commonjs(),
		!isWatching && terser(),
		{
			name: 'emit-module-package-file',
			generateBundle() {
				this.emitFile({
					fileName: 'package.json',
					source: '{ "type": "module" }',
					type: 'asset',
				});
			},
		},
		copyKoffiPlugin(),
	],
};

export default config;
