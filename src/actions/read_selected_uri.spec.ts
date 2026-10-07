import { describe, expect, it } from 'vitest';

import { readSelectedUri } from './read_selected_uri';

describe('readSelectedUri', () => {
	it('should return the stored uri', () => {
		expect(readSelectedUri({ selectedUri: 'spotify:playlist:a' })).toBe(
			'spotify:playlist:a'
		);
	});

	it('should return undefined when the setting is missing', () => {
		expect(readSelectedUri({})).toBeUndefined();
	});

	it('should return undefined when the setting is not a string', () => {
		expect(readSelectedUri({ selectedUri: 42 })).toBeUndefined();
	});

	it('should return undefined when the settings are not an object', () => {
		expect(readSelectedUri(undefined)).toBeUndefined();
	});

	it('should ignore unknown keys', () => {
		expect(
			readSelectedUri({ selectedUri: 'spotify:playlist:a', other: 1 })
		).toBe('spotify:playlist:a');
	});
});
