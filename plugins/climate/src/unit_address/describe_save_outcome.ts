import type { SaveUnitAddressOutcome } from './save_unit_address';

const MESSAGES: Readonly<Record<SaveUnitAddressOutcome, string>> = {
	saved: 'Adresse enregistrée.',
	invalid:
		'Saisissez une adresse IPv4 de votre réseau local, du type 192.168.x.x.',
	'no-answer': "L'unité ne répond pas à cette adresse.",
	incompatible: "Ce n'est pas une unité Daikin avec l'API locale.",
};

/** The short message a property inspector shows for the outcome of saving an address. */
export function describeSaveOutcome(outcome: SaveUnitAddressOutcome): string {
	return MESSAGES[outcome];
}
