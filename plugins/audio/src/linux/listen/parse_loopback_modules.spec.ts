import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { ListenSettings } from './listen_settings';
import { parseLoopbackModules } from './parse_loopback_modules';

describe('parseLoopbackModules', () => {
	it('should read the loopback row of a capture of live modules and ignore the multi-line libpipewire rows', () => {
		const text = readFileSync(
			new URL('./fixtures/pactl_list_short_modules.txt', import.meta.url),
			'utf8'
		);

		expect(parseLoopbackModules(text)).toEqual([
			{
				moduleIndex: 536_870_916,
				requestedSourceId: 'alsa_input.pci-0000_10_00.6.analog-stereo',
				isPluginLoopback: false,
			},
		]);
	});

	it('should tag a loopback whose argument carries the tag token inside its quoted properties', () => {
		const row = `7\tmodule-loopback\tsource=x source_output_properties="node.dont-fallback=true ${ListenSettings.loopbackTag}"\t`;

		expect(parseLoopbackModules(row)[0]?.isPluginLoopback).toBe(true);
	});

	it.each([
		`7\tmodule-loopback\tsource=x other_${ListenSettings.loopbackTag}\t`,
		`7\tmodule-loopback\tsource=x ${ListenSettings.loopbackTag}0\t`,
		`7\tmodule-loopback\tsource=x ${ListenSettings.loopbackTag.replace('true', 'false')}\t`,
	])(
		'should not tag a loopback whose argument only resembles the tag: %s',
		(row) => {
			expect(parseLoopbackModules(row)[0]?.isPluginLoopback).toBe(false);
		}
	);

	it('should ignore a continuation line that looks like an argument', () => {
		expect(
			parseLoopbackModules('            source = nice\n  latency_msec=1\n')
		).toEqual([]);
	});

	it('should ignore a module that is not a loopback', () => {
		expect(
			parseLoopbackModules('12\tmodule-null-sink\tsink_name=x\t\n')
		).toEqual([]);
	});

	it('should leave the source undefined when the argument has none', () => {
		expect(
			parseLoopbackModules('7\tmodule-loopback\tlatency_msec=1\t')
		).toEqual([
			{ moduleIndex: 7, requestedSourceId: undefined, isPluginLoopback: false },
		]);
	});
});
