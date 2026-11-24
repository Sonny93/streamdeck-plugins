import { z } from 'zod';

import { PactlListingError } from '../pactl_listing_error';

const entrySchema = z.object({ index: z.number(), name: z.string() });

/** Maps the index of every source of `pactl -f json list sources` (monitors and virtual ones too) to its name. */
export function parseSourceNamesByIndex(json: unknown): Map<number, string> {
	const entries = z.array(z.unknown()).safeParse(json);
	if (!entries.success) {
		throw new PactlListingError('source list');
	}
	const names = new Map<number, string>();
	for (const raw of entries.data) {
		const parsed = entrySchema.safeParse(raw);
		if (parsed.success) {
			names.set(parsed.data.index, parsed.data.name);
		}
	}
	return names;
}
