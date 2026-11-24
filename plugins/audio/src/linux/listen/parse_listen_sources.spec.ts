import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import {
	FAKE_MIC,
	FAKE_VOLT,
	buildFakeMic,
	buildSourceJson,
} from './fake_listen_system';
import { parseListenSources } from './parse_listen_sources';

function readFixture(name: string): unknown {
	return JSON.parse(
		readFileSync(new URL(`./fixtures/${name}.json`, import.meta.url), 'utf8')
	);
}

describe('parseListenSources', () => {
	it('should keep the hardware inputs of a live capture and drop its monitor', () => {
		const sources = parseListenSources(readFixture('pactl_list_sources'));

		expect(sources.map((source) => source.id)).toEqual([FAKE_VOLT, FAKE_MIC]);
		expect(sources[1]).toMatchObject({
			loudestLevel: 0.08,
			activePort: 'analog-input-rear-mic',
			isMuted: false,
		});
	});

	it('should read the loudest channel instead of the average', () => {
		const [source] = parseListenSources([
			buildSourceJson(buildFakeMic([1, 0.08])),
		]);

		expect(source?.loudestLevel).toBe(1);
	});

	it.each([
		['a monitor', { kind: 'monitor' as const, name: 'x.monitor' }],
		['a virtual source', { kind: 'virtual' as const, name: 'virtual_mic' }],
		[
			'a source without device.api',
			{ kind: 'hardware-without-api' as const, name: 'no_api' },
		],
		[
			'a dash-prefixed name',
			{ kind: 'hardware' as const, name: '-alsa_input' },
		],
		['a name with a space', { kind: 'hardware' as const, name: 'alsa input' }],
		['a name with a quote', { kind: 'hardware' as const, name: "alsa'input" }],
		[
			'a name with a double quote',
			{ kind: 'hardware' as const, name: 'alsa"input' },
		],
		['an empty name', { kind: 'hardware' as const, name: '' }],
	])('should drop %s', (_label, override) => {
		const entry = buildSourceJson({ ...buildFakeMic(), ...override });

		expect(parseListenSources([entry])).toEqual([]);
	});

	it('should drop a source without a readable volume', () => {
		const entry = {
			...(buildSourceJson(buildFakeMic()) as object),
			volume: {},
		};

		expect(parseListenSources([entry])).toEqual([]);
	});
});
