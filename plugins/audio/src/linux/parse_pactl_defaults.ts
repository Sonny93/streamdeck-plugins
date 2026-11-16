import { z } from 'zod';

import type { AudioFlow } from '../audio/audio_flow';
import { PactlListingError } from './pactl_listing_error';

const serverInfoSchema = z.object({
	default_sink_name: z.string().optional(),
	default_source_name: z.string().optional(),
});

function toDeviceId(name: string | undefined): string | undefined {
	return name === undefined || name === '' ? undefined : name;
}

/** Reads the default output and input names out of `pactl -f json info`. */
export function parsePactlDefaults(
	json: unknown
): Record<AudioFlow, string | undefined> {
	const info = serverInfoSchema.safeParse(json);
	if (!info.success) {
		throw new PactlListingError('server description');
	}
	return {
		output: toDeviceId(info.data.default_sink_name),
		input: toDeviceId(info.data.default_source_name),
	};
}
