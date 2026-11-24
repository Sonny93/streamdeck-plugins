import { z } from 'zod';

import { pactlChannelSchema } from '../pactl_channel_schema';
import { PactlListingError } from '../pactl_listing_error';
import { readLoudestChannelLevel } from '../read_loudest_channel_level';

const streamSchema = z.object({
	owner_module: z.string().nullish(),
	source: z.number().optional(),
	volume: z.record(z.string(), pactlChannelSchema).optional(),
});

/** A stream a module owns: a capture stream (`source-outputs`) or a playback stream (`sink-inputs`). */
export type ModuleStream = Readonly<{
	ownerModuleIndex: number;
	/** Index of the source a capture stream is linked to; `undefined` for a playback stream. */
	sourceIndex: number | undefined;
	/** `undefined` when no channel of the stream can be read. */
	loudestLevel: number | undefined;
}>;

function toModuleStream(raw: unknown): ModuleStream[] {
	const parsed = streamSchema.safeParse(raw);
	if (!parsed.success) {
		return [];
	}
	const owner = Number(parsed.data.owner_module ?? Number.NaN);
	if (!Number.isSafeInteger(owner)) {
		return [];
	}
	return [
		{
			ownerModuleIndex: owner,
			sourceIndex: parsed.data.source,
			loudestLevel: readLoudestChannelLevel(parsed.data.volume),
		},
	];
}

/** Reads `pactl -f json list source-outputs` or `list sink-inputs` into the streams that a module owns; the others are dropped. */
export function parseModuleStreams(json: unknown): ModuleStream[] {
	const entries = z.array(z.unknown()).safeParse(json);
	if (!entries.success) {
		throw new PactlListingError('stream list');
	}
	return entries.data.flatMap(toModuleStream);
}
