import { streamDeck } from '@elgato/streamdeck';

import { unitAddressSettingsSchema } from './unit_address_settings_schema';
import { validateUnitAddress } from './validate_unit_address';

/** Keeps the address of the unit in the Stream Deck global settings; an invalid or missing value reads as no address. */
export class UnitAddressStore {
	async load(): Promise<string | undefined> {
		const parsed = unitAddressSettingsSchema.safeParse(
			await streamDeck.settings.getGlobalSettings()
		);
		if (!parsed.success || parsed.data.host === undefined) {
			return undefined;
		}
		return validateUnitAddress(parsed.data.host);
	}

	async save(host: string): Promise<void> {
		await streamDeck.settings.setGlobalSettings({ host });
	}
}
