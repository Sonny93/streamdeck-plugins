import { describe, expect, it } from 'vitest';

import { readListenTarget } from './read_listen_target';

describe('readListenTarget', () => {
	it('should read the input and the ceiling as a fraction', () => {
		expect(
			readListenTarget({ device: ' alsa_input.rear_mic ', maximumLevel: '30' })
		).toEqual({ sourceId: 'alsa_input.rear_mic', maximumLevel: 0.3 });
	});

	it.each([
		undefined,
		{},
		{ device: '' },
		{ device: '  ' },
		{ device: 4 },
		'x',
	])('should pick no input and the default ceiling for %j', (rawSettings) => {
		expect(readListenTarget(rawSettings)).toEqual({
			sourceId: undefined,
			maximumLevel: 0.2,
		});
	});
});
