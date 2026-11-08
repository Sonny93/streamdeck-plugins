import { describe, expect, it } from 'vitest';

import { buildVariantName } from './build_variant_name.ts';

describe('buildVariantName', () => {
	it('should join the short names of the plugins after the profile name', () => {
		expect(
			buildVariantName({
				profileName: 'spotify-deck',
				plugins: ['com.sonny93.audio', 'com.sonny93.display'],
			})
		).toBe('spotify-deck--audio-display');
	});
});
