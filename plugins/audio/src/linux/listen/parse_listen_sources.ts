import { z } from 'zod';

import type { ListenSource } from '../../listen/listen_source';
import { pactlChannelSchema } from '../pactl_channel_schema';
import { PactlListingError } from '../pactl_listing_error';
import { readLoudestChannelLevel } from '../read_loudest_channel_level';

const HARDWARE_SOURCE_CLASS = 'Audio/Source';
const MONITOR_DEVICE_CLASS = 'monitor';
const UNSAFE_NAME_PATTERN = /[\s'"]/u;

const sourceSchema = z.object({
	name: z.string(),
	description: z.string().optional(),
	mute: z.boolean().optional(),
	volume: z.record(z.string(), pactlChannelSchema).optional(),
	monitor_source: z.string().optional(),
	active_port: z.string().nullish(),
	properties: z.record(z.string(), z.unknown()).optional(),
});

type PactlSource = z.infer<typeof sourceSchema>;

/** A name that would read as an option, or split or quote into several arguments of `pactl`. */
function isSafeName(name: string): boolean {
	return (
		name !== '' && !name.startsWith('-') && !UNSAFE_NAME_PATTERN.test(name)
	);
}

function isHardwareInput(source: PactlSource): boolean {
	const properties = source.properties ?? {};
	return (
		properties['media.class'] === HARDWARE_SOURCE_CLASS &&
		properties['device.api'] !== undefined &&
		properties['device.class'] !== MONITOR_DEVICE_CLASS &&
		(source.monitor_source ?? '') === ''
	);
}

function toListenSource(source: PactlSource): ListenSource | undefined {
	const loudestLevel = readLoudestChannelLevel(source.volume);
	if (loudestLevel === undefined || !isSafeName(source.name)) {
		return undefined;
	}
	const description = source.description ?? '';
	return {
		id: source.name,
		name: description === '' ? source.name : description,
		loudestLevel,
		isMuted: source.mute ?? false,
		activePort: source.active_port ?? undefined,
	};
}

/**
 * Reads `pactl -f json list sources` into the hardware inputs that listening may use.
 * A monitor, a virtual source, an entry without a readable volume, with an unsafe name or off the expected shape is dropped.
 */
export function parseListenSources(json: unknown): ListenSource[] {
	const entries = z.array(z.unknown()).safeParse(json);
	if (!entries.success) {
		throw new PactlListingError('source list');
	}
	return entries.data.flatMap((raw) => {
		const parsed = sourceSchema.safeParse(raw);
		if (!parsed.success || !isHardwareInput(parsed.data)) {
			return [];
		}
		const source = toListenSource(parsed.data);
		return source === undefined ? [] : [source];
	});
}
