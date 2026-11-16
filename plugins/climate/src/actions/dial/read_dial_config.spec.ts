import { describe, expect, it } from 'vitest';

import { readDialConfig } from './read_dial_config';

describe('readDialConfig', () => {
	it.each([
		['0.5', 0.5],
		['1', 1],
		[1, 1],
		[0.5, 0.5],
	])(
		'should read the step %j when it is one of the two allowed',
		(step, expected) => {
			expect(readDialConfig({ step })).toEqual({ step: expected });
		}
	);

	it.each([{}, { step: '2' }, { step: '' }, { step: 'big' }, undefined])(
		'should step by half a degree when the settings are %j',
		(settings) => {
			expect(readDialConfig(settings)).toEqual({ step: 0.5 });
		}
	);
});
