import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { PactlListingError } from './pactl_listing_error';
import { parsePactlDevices } from './parse_pactl_devices';

function readFixture(name: string): unknown {
	return JSON.parse(
		readFileSync(new URL(`./fixtures/${name}.json`, import.meta.url), 'utf8')
	);
}

const VOLT_SINK = {
	id: 'alsa_output.usb-Universal_Audio_Volt_1_00000000000000-00.analog-stereo',
	name: 'Volt 1 Stéréo analogique',
	flow: 'output',
};

describe('parsePactlDevices', () => {
	it('lists the sinks with their name, volume and mute state', () => {
		const entries = parsePactlDevices(
			readFixture('pactl_list_sinks'),
			'output'
		);

		expect(entries).toHaveLength(2);
		expect(entries[1]).toEqual({
			device: VOLT_SINK,
			volume: { level: 0.4, isMuted: false },
		});
	});

	it('drops the monitors of the sinks from the inputs', () => {
		const entries = parsePactlDevices(
			readFixture('pactl_list_sources'),
			'input'
		);

		expect(entries.map((entry) => entry.device.name)).toEqual([
			'Volt 1 Stéréo analogique',
			'Example Audio Controller Stéréo analogique',
		]);
		expect(entries.every((entry) => entry.device.flow === 'input')).toBe(true);
	});

	it('falls back on the raw value when the percent is missing, and averages the channels', () => {
		const entries = parsePactlDevices(
			[
				{
					name: 'sink-a',
					mute: true,
					volume: {
						'front-left': { value: 32_768 },
						'front-right': { value: 65_536, value_percent: '100%' },
					},
				},
			],
			'output'
		);

		expect(entries).toEqual([
			{
				device: { id: 'sink-a', name: 'sink-a', flow: 'output' },
				volume: { level: 0.75, isMuted: true },
			},
		]);
	});

	it('keeps a boosted volume at full level', () => {
		const [entry] = parsePactlDevices(
			[{ name: 'sink-a', volume: { mono: { value_percent: '130%' } } }],
			'output'
		);

		expect(entry?.volume.level).toBe(1);
	});

	it('skips entries without a usable name and entries that are not objects', () => {
		const entries = parsePactlDevices(
			[{ name: '-oops' }, { name: '' }, { index: 3 }, 'nope', { name: 'ok' }],
			'output'
		);

		expect(entries.map((entry) => entry.device.id)).toEqual(['ok']);
	});

	it('rejects an output that is not a list', () => {
		expect(() => parsePactlDevices({}, 'output')).toThrow(PactlListingError);
	});
});
