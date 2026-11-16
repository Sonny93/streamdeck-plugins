import { describe, expect, it } from 'vitest';

import { parseKscreenOutputs } from './parse_kscreen_outputs';
import { readFixture } from './read_fixture';

function outputOf(connector: string) {
	return parseKscreenOutputs(readFixture('kscreen_doctor.json')).find(
		(output) => output.connector === connector
	);
}

describe('parseKscreenOutputs', () => {
	it('should list the enabled outputs of a real capture', () => {
		const connectors = parseKscreenOutputs(
			readFixture('kscreen_doctor.json')
		).map((output) => output.connector);

		expect(connectors).toEqual(['DP-6', 'DP-5', 'DP-4']);
	});

	it('should take the output of priority 1 as the primary one', () => {
		expect(outputOf('DP-4')?.isPrimary).toBe(true);
		expect(outputOf('DP-5')?.isPrimary).toBe(false);
	});

	it('should give the bounds in logical pixels, dividing the size by the scale', () => {
		expect(outputOf('DP-4')?.bounds).toEqual({
			left: 0,
			top: 1080,
			width: 4655,
			height: 1310,
		});
		expect(outputOf('DP-5')?.bounds).toEqual({
			left: 4655,
			top: 1080,
			width: 1080,
			height: 1920,
		});
	});

	it('should read HDR as unsupported when the hdr key is missing', () => {
		expect(outputOf('DP-5')?.hdr).toEqual({
			isSupported: false,
			isEnabled: false,
		});
		expect(outputOf('DP-4')?.hdr).toEqual({
			isSupported: true,
			isEnabled: false,
		});
	});

	it('should turn the brightness fraction into a percentage', () => {
		expect(outputOf('DP-5')?.brightnessPercent).toBe(100);
		expect(outputOf('DP-6')?.brightnessPercent).toBe(0);
	});

	it('should read the SDR brightness only on the output that has one', () => {
		expect(outputOf('DP-4')?.sdrBrightnessNits).toBe(248);
		expect(outputOf('DP-5')?.sdrBrightnessNits).toBeUndefined();
	});

	it('should tell the outputs whose DDC/CI KWin drives', () => {
		expect(outputOf('DP-5')?.isDdcCiAllowed).toBe(true);
		expect(outputOf('DP-4')?.isDdcCiAllowed).toBe(false);
	});

	it('should skip disabled outputs and outputs with an unsafe name', () => {
		const json = JSON.stringify({
			outputs: [
				{
					name: 'DP-1',
					enabled: false,
					pos: { x: 0, y: 0 },
					size: { width: 1, height: 1 },
				},
				{
					name: '../../etc',
					enabled: true,
					pos: { x: 0, y: 0 },
					size: { width: 1, height: 1 },
				},
			],
		});

		expect(parseKscreenOutputs(json)).toEqual([]);
	});

	it('should give nothing for output that is not JSON', () => {
		expect(parseKscreenOutputs('not json')).toEqual([]);
	});
});
