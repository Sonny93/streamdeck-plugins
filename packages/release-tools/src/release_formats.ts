/** Folder suffixes and file extensions of the Stream Deck packages. */
export const ReleaseFormats = {
	pluginFolderSuffix: '.sdPlugin',
	iconPackFolderSuffix: '.sdIconPack',
	iconPackFileExtension: '.streamDeckIconPack',
	profileFileExtension: '.streamDeckProfile',
	manifestFile: 'manifest.json',
	pluginEntryFile: 'bin/plugin.js',
	cliBinSpecifier: '@elgato/cli/bin/streamdeck.mjs',
} as const;
