import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { PactlListingError } from './pactl_listing_error';
import { parsePactlDefaults } from './parse_pactl_defaults';

describe('parsePactlDefaults', () => {
	it('reads the default sink and source names of the server', () => {
		const info: unknown = JSON.parse(
			readFileSync(
				new URL('./fixtures/pactl_info.json', import.meta.url),
				'utf8'
			)
		);

		expect(parsePactlDefaults(info)).toEqual({
			output:
				'alsa_output.usb-Universal_Audio_Volt_1_00000000000000-00.analog-stereo',
			input:
				'alsa_input.usb-Universal_Audio_Volt_1_00000000000000-00.analog-stereo',
		});
	});

	it('reports no default for a missing or empty name', () => {
		expect(parsePactlDefaults({ default_source_name: '' })).toEqual({
			output: undefined,
			input: undefined,
		});
	});

	it('rejects an output that is not an object', () => {
		expect(() => parsePactlDefaults([])).toThrow(PactlListingError);
	});
});
