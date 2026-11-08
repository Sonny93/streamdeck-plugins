/** Plugin identifiers that Stream Deck itself provides, and the ones this repo ships. */
export const ProfileActionUuids = {
	elgatoPrefix: 'com.elgato.',
	multiActionsPrefix: 'com.elgato.streamdeck.multiactions',
	openChild: 'com.elgato.streamdeck.profile.openchild',
	backToParent: 'com.elgato.streamdeck.profile.backtoparent',
	rotate: 'com.elgato.streamdeck.profile.rotate',
	personalPrefix: 'com.sonny93.',
} as const;

/** The page identifier Stream Deck writes when no page is current. */
export const NO_CURRENT_PAGE = '00000000-0000-0000-0000-000000000000';
