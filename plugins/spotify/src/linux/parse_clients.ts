import { z } from 'zod';

import type { ClientInfo } from './client_info';
import { readProcessIdProperty } from './read_process_id_property';

const BINARY_PROPERTY = 'application.process.binary';

const clientSchema = z.object({
	index: z.number().int().nonnegative(),
	properties: z.record(z.string(), z.unknown()),
});

/** Maps the index of each client of `pactl list clients` to its binary and process; a client with neither is left out. */
export function parseClients(
	rawClients: unknown
): ReadonlyMap<number, ClientInfo> {
	const clients = new Map<number, ClientInfo>();
	const parsed = z.array(z.unknown()).safeParse(rawClients);
	for (const rawClient of parsed.success ? parsed.data : []) {
		const client = clientSchema.safeParse(rawClient);
		if (!client.success) {
			continue;
		}
		const { index, properties } = client.data;
		const binary = properties[BINARY_PROPERTY];
		const info: ClientInfo = {
			binary: typeof binary === 'string' && binary !== '' ? binary : undefined,
			processId: readProcessIdProperty(properties),
		};
		if (info.binary !== undefined || info.processId !== undefined) {
			clients.set(index, info);
		}
	}
	return clients;
}
