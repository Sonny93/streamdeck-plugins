import { describe, expect, it } from 'vitest';

import { buildDeviceKeySvg } from './build_device_key_svg';

function build(
	overrides: Partial<Parameters<typeof buildDeviceKeySvg>[0]> = {}
) {
	return buildDeviceKeySvg({
		kind: 'phone',
		label: 'Phone',
		isActive: false,
		...overrides,
	});
}

describe('buildDeviceKeySvg', () => {
	it('should draw the icon and the label in green while the device plays', () => {
		const svg = build({ isActive: true });

		expect(svg).toContain('stroke="#1DB954"');
		expect(svg).toContain('fill="#1DB954"');
		expect(svg).not.toContain('#B3B3B3');
	});

	it('should draw the icon and the label in grey otherwise', () => {
		const svg = build();

		expect(svg).toContain('stroke="#B3B3B3"');
		expect(svg).not.toContain('#1DB954');
	});

	it('should draw the label below the icon', () => {
		expect(build()).toMatch(/<text [^>]*y="130"[^>]*>Phone<\/text>/);
	});

	it('should escape the label', () => {
		expect(build({ label: '49" <TV>' })).toContain('49&quot; &lt;TV&gt;');
	});

	it('should shorten a label too long for the key', () => {
		expect(build({ label: 'A very long name for a speaker' })).toContain('…');
	});

	it('should draw a different icon for each kind of device', () => {
		const svgs = new Set(
			(['computer', 'phone', 'tv', 'speaker'] as const).map((kind) =>
				build({ kind })
			)
		);

		expect(svgs.size).toBe(4);
	});

	it('should leave the label out when it is empty', () => {
		expect(build({ label: '' })).not.toContain('<text');
	});
});
