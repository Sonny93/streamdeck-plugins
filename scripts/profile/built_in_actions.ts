/** The Stream Deck app's own folder actions, as it writes them in a page manifest. */
export const BuiltInActions = {
	version: '1.0',
	openFolder: {
		uuid: 'com.elgato.streamdeck.profile.openchild',
		name: 'Create Folder',
	},
	backToParent: {
		uuid: 'com.elgato.streamdeck.profile.backtoparent',
		name: 'Parent Folder',
		pluginName: 'Open Parent Folder',
		column: 0,
		row: 0,
	},
} as const;
