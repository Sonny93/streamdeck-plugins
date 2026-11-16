import { MessageCatalog } from 'deck-kit/i18n/message_catalog';

/** Every text the plugin draws or sends to a property inspector, in English and French. */
export const spotifyMessages = new MessageCatalog({
	volumeCaptionSpotify: { en: 'SPOTIFY', fr: 'SPOTIFY' },
	volumeCaptionFocused: { en: 'FOCUSED APP', fr: 'APPLI ACTIVE' },
	volumeCaptionApp: { en: 'APP', fr: 'APPLI' },
	noApp: { en: 'No app', fr: 'Aucune appli' },
	pickApp: { en: 'Pick an app', fr: 'Choisir appli' },
	muted: { en: 'Muted', fr: 'Muet' },
	notPlayingSound: { en: 'Not playing sound', fr: 'Aucun son en cours' },
	pressToUnmute: {
		en: 'Press to unmute',
		fr: 'Appuyer pour rétablir le son',
	},
	spotifyClosed: { en: 'Spotify closed', fr: 'Spotify fermé' },
	likedSongs: { en: 'Liked Songs', fr: 'Titres likés' },
	noDevice: { en: 'No device', fr: 'Sans appareil' },
	unnamedDevice: { en: 'Device', fr: 'Appareil' },
	pickedDevice: { en: 'Picked device', fr: 'Appareil choisi' },
	deviceNotFound: { en: '{name} (not found)', fr: '{name} (introuvable)' },
});
