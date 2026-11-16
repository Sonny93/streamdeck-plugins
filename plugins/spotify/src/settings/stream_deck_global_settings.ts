import { streamDeck } from '@elgato/streamdeck';
import type { GlobalSettingsPort } from 'deck-kit/settings/global_settings_port';

/** The global settings of the plugin, as the Stream Deck SDK keeps them. */
export const streamDeckGlobalSettings: GlobalSettingsPort = {
	read: () => streamDeck.settings.getGlobalSettings(),
	write: (settings) => streamDeck.settings.setGlobalSettings(settings),
};
