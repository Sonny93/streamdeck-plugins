import { MessageCatalog } from 'deck-kit/i18n/message_catalog';

/** Every text the plugin draws or sends to a property inspector, in English and French. */
export const displayMessages = new MessageCatalog({
	allMonitors: { en: 'All monitors', fr: 'Tous les écrans' },
	brightnessTitle: { en: 'Brightness', fr: 'Luminosité' },
	noMonitor: { en: 'No monitor', fr: 'Aucun écran' },
	notAdjustable: { en: 'Not adjustable', fr: 'Non réglable' },
	monitorOff: { en: 'Off', fr: 'Éteint' },
	hdrBadge: { en: 'HDR', fr: 'HDR' },
	snapshotUnavailable: { en: 'Unavailable', fr: 'Indisponible' },
	screenKeyLabel: { en: 'Screen', fr: 'Écran' },
	mainMonitor: { en: 'Main monitor', fr: 'Écran principal' },
	monitorNotLit: { en: 'Monitor not lit', fr: 'Écran non allumé' },
});
