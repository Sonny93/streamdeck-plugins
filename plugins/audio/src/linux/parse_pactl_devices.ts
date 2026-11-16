import { z } from 'zod';

import type { AudioFlow } from '../audio/audio_flow';
import type { AudioVolume } from '../audio/audio_volume';
import type { LinuxAudioEntry } from './linux_audio_entry';
import { PactlListingError } from './pactl_listing_error';

/** PulseAudio volume of 100 %, the `value` of a channel at full scale. */
const NORMAL_VOLUME_VALUE = 65_536;
const PERCENT_PATTERN = /^\s*(\d+(?:\.\d+)?)\s*%/u;
const MONITOR_DEVICE_CLASS = 'monitor';

const channelSchema = z.object({
	value: z.number().optional(),
	value_percent: z.string().optional(),
});

const entrySchema = z.object({
	name: z.string(),
	description: z.string().optional(),
	mute: z.boolean().optional(),
	volume: z.record(z.string(), channelSchema).optional(),
	monitor_source: z.string().optional(),
	properties: z.record(z.string(), z.unknown()).optional(),
});

type PactlEntry = z.infer<typeof entrySchema>;
type PactlChannel = z.infer<typeof channelSchema>;

function readChannelLevel(channel: PactlChannel): number | undefined {
	const percent = PERCENT_PATTERN.exec(channel.value_percent ?? '')?.[1];
	if (percent !== undefined) {
		return Number(percent) / 100;
	}
	return channel.value === undefined
		? undefined
		: channel.value / NORMAL_VOLUME_VALUE;
}

function readLevel(entry: PactlEntry): number {
	const levels = Object.values(entry.volume ?? {}).flatMap((channel) => {
		const level = readChannelLevel(channel);
		return level === undefined ? [] : [level];
	});
	if (levels.length === 0) {
		return 0;
	}
	const average = levels.reduce((sum, level) => sum + level, 0) / levels.length;
	return Math.min(1, Math.max(0, average));
}

function isMonitor(entry: PactlEntry): boolean {
	return (
		(entry.monitor_source ?? '') !== '' ||
		entry.properties?.['device.class'] === MONITOR_DEVICE_CLASS
	);
}

/** A name that starts with a dash would read as an option once passed to `pactl`. */
function isSafeName(name: string): boolean {
	return name !== '' && !name.startsWith('-');
}

function toVolume(entry: PactlEntry): AudioVolume {
	return { level: readLevel(entry), isMuted: entry.mute ?? false };
}

/**
 * Reads the output of `pactl -f json list sinks` or `list sources` into the devices with their volume.
 * A source that monitors a sink is not an input and is dropped; an entry that does not fit the expected shape is skipped.
 */
export function parsePactlDevices(
	json: unknown,
	flow: AudioFlow
): LinuxAudioEntry[] {
	const entries = z.array(z.unknown()).safeParse(json);
	if (!entries.success) {
		throw new PactlListingError('device list');
	}
	return entries.data.flatMap((raw) => {
		const parsed = entrySchema.safeParse(raw);
		if (!parsed.success || !isSafeName(parsed.data.name)) {
			return [];
		}
		const entry = parsed.data;
		if (flow === 'input' && isMonitor(entry)) {
			return [];
		}
		const name = entry.description ?? entry.name;
		return [
			{
				device: { id: entry.name, name: name === '' ? entry.name : name, flow },
				volume: toVolume(entry),
			},
		];
	});
}
