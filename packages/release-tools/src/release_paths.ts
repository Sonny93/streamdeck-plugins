import path from 'node:path';

const ROOT_DIRECTORY = path.resolve(import.meta.dirname, '..', '..', '..');
const DIST_DIRECTORY = path.join(ROOT_DIRECTORY, 'dist');

/** Where the files to ship are read from and where the release files are written, relative to the repository root. */
export const ReleasePaths = {
	rootDirectory: ROOT_DIRECTORY,
	rootPackageFile: path.join(ROOT_DIRECTORY, 'package.json'),
	pluginsDirectory: path.join(ROOT_DIRECTORY, 'plugins'),
	iconPackDirectory: path.join(ROOT_DIRECTORY, 'icon-pack'),
	profilesDirectory: path.join(ROOT_DIRECTORY, 'profiles'),
	installScriptFile: path.join(
		ROOT_DIRECTORY,
		'packages',
		'release-tools',
		'assets',
		'install.ps1'
	),
	distDirectory: DIST_DIRECTORY,
	stagingDirectory: path.join(DIST_DIRECTORY, '.staging'),
} as const;
