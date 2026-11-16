import { MessageCatalog } from 'deck-kit/i18n/message_catalog';

/** Every text the plugin draws or sends to a property inspector, in English and French. */
export const audioMessages = new MessageCatalog({
	volumeTitle: { en: 'Volume', fr: 'Volume' },
	outputTitle: { en: 'Output', fr: 'Sortie' },
	inputTitle: { en: 'Input', fr: 'Entrée' },
	noDevice: { en: 'No device', fr: 'Introuvable' },
	muted: { en: 'Muted', fr: 'Muet' },
	unavailable: { en: 'Unavailable', fr: 'Indisponible' },
	voltTitle: { en: 'Volt 1', fr: 'Volt 1' },
	voltMonitor: { en: 'Monitor', fr: 'Monitor' },
	voltVintage: { en: 'Vintage', fr: 'Vintage' },
	voltPhantomPower: { en: '48V', fr: '48V' },
	buttonOn: { en: 'On', fr: 'Activé' },
	buttonOff: { en: 'Off', fr: 'Désactivé' },
	voltNotConnected: { en: 'Not connected', fr: 'Non connectée' },
	voltNoReport: { en: 'No report yet', fr: 'Pas encore de rapport' },
	muteKeyLabel: { en: 'Micro', fr: 'Micro' },
	elgatoKeyLabel: { en: 'Elgato', fr: 'Elgato' },
	followSystem: { en: 'Follow system', fr: 'Suivre le système' },
	defaultOutput: { en: 'Default output', fr: 'Sortie par défaut' },
	defaultInput: { en: 'Default input', fr: 'Entrée par défaut' },
	outputsGroup: { en: 'Outputs', fr: 'Sorties' },
	inputsGroup: { en: 'Inputs', fr: 'Entrées' },
	unpluggedDevice: { en: 'Unplugged device', fr: 'Périphérique débranché' },
});
