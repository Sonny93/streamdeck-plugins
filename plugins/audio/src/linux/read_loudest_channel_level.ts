import type { z } from 'zod';

import type { pactlChannelSchema } from './pactl_channel_schema';
import { readChannelLevel } from './read_channel_level';

/** Reads the level of the loudest channel of a `volume` object, or `undefined` when no channel can be read. */
export function readLoudestChannelLevel(
	volume:
		| Readonly<Record<string, z.infer<typeof pactlChannelSchema>>>
		| undefined
): number | undefined {
	const levels = Object.values(volume ?? {}).flatMap((channel) => {
		const level = readChannelLevel(channel);
		return level === undefined ? [] : [level];
	});
	return levels.length === 0 ? undefined : Math.max(...levels);
}
