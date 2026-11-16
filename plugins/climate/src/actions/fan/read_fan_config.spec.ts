import { describe, expect, it } from 'vitest';

import { readFanConfig } from './read_fan_config';

describe('readFanConfig', () => {
	it.each(['rate', 'swing'] as const)(
		'should keep the control when it is %s',
		(control) => {
			expect(readFanConfig({ control })).toEqual({ control });
		}
	);

	it.each([{}, { control: 'sideways' }, undefined, null])(
		'should control the fan rate when the settings are %j',
		(settings) => {
			expect(readFanConfig(settings)).toEqual({ control: 'rate' });
		}
	);
});
