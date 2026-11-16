import { readFileSync } from 'node:fs';

import type { LinuxAudioEntry } from '../../linux/linux_audio_entry';
import { parsePactlDevices } from '../../linux/parse_pactl_devices';

function readFixture(name: string): unknown {
	return JSON.parse(
		readFileSync(
			new URL(`../../linux/fixtures/${name}.json`, import.meta.url),
			'utf8'
		)
	);
}

/** Test helper: the devices of the `pactl` fixtures, which hold no serial, hostname or home path. */
export function readFixtureAudioEntriesForTest(): readonly LinuxAudioEntry[] {
	return [
		...parsePactlDevices(readFixture('pactl_list_sinks'), 'output'),
		...parsePactlDevices(readFixture('pactl_list_sources'), 'input'),
	];
}
