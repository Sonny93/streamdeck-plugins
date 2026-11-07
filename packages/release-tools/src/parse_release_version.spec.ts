import { describe, expect, it } from 'vitest';

import { InvalidReleaseVersionError } from './invalid_release_version_error.ts';
import { parseReleaseVersion } from './parse_release_version.ts';

describe('parseReleaseVersion', () => {
	it('should return the version when it is X.Y.Z', () => {
		expect(parseReleaseVersion({ version: '1.20.3' })).toBe('1.20.3');
	});

	it.each(['1.0.0-next.0', '1.0.0-rc.1', '2.3.4-alpha'])(
		'should return the base version when the version is the prerelease %j',
		(version) => {
			expect(parseReleaseVersion({ version })).toBe(version.split('-')[0]);
		}
	);

	it.each([
		'1.0',
		'1.0.0-',
		'1.0.0-next..1',
		'1.0.0-next_1',
		'v1.0.0',
		'1.0.0.0',
		'',
		'latest',
	])('should fail when the version is %j', (version) => {
		expect(() => parseReleaseVersion({ version })).toThrow(
			InvalidReleaseVersionError
		);
	});

	it('should fail when the version is not a string', () => {
		expect(() => parseReleaseVersion({ version: undefined })).toThrow(
			InvalidReleaseVersionError
		);
	});
});
