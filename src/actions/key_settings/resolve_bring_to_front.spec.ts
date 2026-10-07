import { describe, expect, it } from 'vitest';

import { resolveBringToFront } from './resolve_bring_to_front';

function resolve(rawSettings: unknown, defaultValue: boolean): boolean {
	return resolveBringToFront({ rawSettings, defaultValue });
}

describe('resolveBringToFront', () => {
	it('should return the stored value when it is true', () => {
		expect(resolve({ bringToFront: true }, false)).toBe(true);
	});

	it('should return the stored value when it is false', () => {
		expect(resolve({ bringToFront: false }, true)).toBe(false);
	});

	it('should return the default when the setting is missing', () => {
		expect(resolve({}, true)).toBe(true);
	});

	it('should return the default when the setting is not a boolean', () => {
		expect(resolve({ bringToFront: 'yes' }, false)).toBe(false);
	});

	it('should return the default when the settings are not an object', () => {
		expect(resolve(undefined, true)).toBe(true);
	});

	it('should ignore unknown keys', () => {
		expect(resolve({ bringToFront: false, other: 1 }, true)).toBe(false);
	});
});
