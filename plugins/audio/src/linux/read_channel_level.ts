import type { z } from 'zod';

import type { pactlChannelSchema } from './pactl_channel_schema';

/** PulseAudio volume of 100 %, the `value` of a channel at full scale. */
const NORMAL_VOLUME_VALUE = 65_536;
const PERCENT_PATTERN = /^\s*(\d+(?:\.\d+)?)\s*%/u;
const PERCENT_SCALE = 100;

/** Reads the level of one channel, 1 for 100 %, or `undefined` when the channel carries neither a percent nor a value. */
export function readChannelLevel(
	channel: z.infer<typeof pactlChannelSchema>
): number | undefined {
	const percent = PERCENT_PATTERN.exec(channel.value_percent ?? '')?.[1];
	if (percent !== undefined) {
		return Number(percent) / PERCENT_SCALE;
	}
	return channel.value === undefined
		? undefined
		: channel.value / NORMAL_VOLUME_VALUE;
}
