import { z } from 'zod';

import type { GlobalSettingsPort } from './global_settings_port';
import type { JsonObject } from './json_object';

const jsonObjectSchema = z.record(z.string(), z.json());

/**
 * Writes some global settings without losing the others: the global settings are one object shared by everything the plugin stores,
 * and writing replaces it whole. Settings that cannot be read as an object count as empty.
 */
export async function mergeGlobalSettings(
	port: GlobalSettingsPort,
	patch: JsonObject
): Promise<void> {
	const existing = jsonObjectSchema.safeParse(await port.read());
	await port.write({ ...(existing.success ? existing.data : {}), ...patch });
}
