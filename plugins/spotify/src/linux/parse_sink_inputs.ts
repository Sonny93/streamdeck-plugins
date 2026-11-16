import { z } from 'zod';

import { formatAppDisplayName } from '../audio/format_app_display_name';
import type { ClientInfo } from './client_info';
import { readProcessIdProperty } from './read_process_id_property';
import type { SinkInput } from './sink_input';

const PERCENT = 100;
const MAX_VOLUME = 1;

const sinkInputSchema = z.object({
	index: z.number().int().nonnegative(),
	mute: z.boolean(),
	volume: z.record(z.string(), z.object({ value_percent: z.string() })),
	client: z.string().optional(),
	properties: z.record(z.string(), z.unknown()),
});

function readProperty(
	properties: Readonly<Record<string, unknown>>,
	key: string
): string | undefined {
	const value = properties[key];
	return typeof value === 'string' && value !== '' ? value : undefined;
}

function averageVolume(
	channels: readonly Readonly<{ value_percent: string }>[]
): number | undefined {
	const volumes = channels
		.map((channel) => Number.parseInt(channel.value_percent, 10) / PERCENT)
		.filter((volume) => Number.isFinite(volume));
	if (volumes.length === 0) {
		return undefined;
	}
	const sum = volumes.reduce((total, volume) => total + volume, 0);
	return Math.min(MAX_VOLUME, sum / volumes.length);
}

function resolveImageName(
	options: Readonly<{
		properties: Readonly<Record<string, unknown>>;
		client: ClientInfo | undefined;
	}>
): string | undefined {
	return (
		readProperty(options.properties, 'application.process.binary') ??
		options.client?.binary ??
		readProperty(options.properties, 'node.name')?.toLowerCase()
	);
}

function toSinkInput(
	raw: unknown,
	clients: ReadonlyMap<number, ClientInfo>
): SinkInput | undefined {
	const parsed = sinkInputSchema.safeParse(raw);
	if (!parsed.success) {
		return undefined;
	}
	const { index, mute, volume, properties, client } = parsed.data;
	const clientInfo = clients.get(Number(client));
	const imageName = resolveImageName({ properties, client: clientInfo });
	const averaged = averageVolume(Object.values(volume));
	if (imageName === undefined || averaged === undefined) {
		return undefined;
	}
	return {
		index,
		imageName,
		displayName:
			readProperty(properties, 'application.name') ??
			formatAppDisplayName(imageName),
		volume: averaged,
		isMuted: mute,
		processId: readProcessIdProperty(properties) ?? clientInfo?.processId,
	};
}

/**
 * Reads the JSON of `pactl list sink-inputs` into the streams that name their program.
 * The program is the stream's `application.process.binary`, else the binary of its client in `pactl list clients`
 * (native PipeWire clients such as Spotify only set it there; the process id follows the same order), else its lowercased `node.name`.
 * A stream without a program or without a volume is left out, since no app can be matched to it.
 */
export function parseSinkInputs(
	rawListing: unknown,
	clients: ReadonlyMap<number, ClientInfo> = new Map()
): SinkInput[] {
	const parsed = z.array(z.unknown()).safeParse(rawListing);
	if (!parsed.success) {
		return [];
	}
	return parsed.data
		.map((raw) => toSinkInput(raw, clients))
		.filter((sinkInput) => sinkInput !== undefined);
}
