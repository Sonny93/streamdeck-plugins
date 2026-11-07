import { describe, expect, it } from 'vitest';

import { ManifestVersionError } from './manifest_version_error.ts';
import { setManifestVersion } from './set_manifest_version.ts';

describe('setManifestVersion', () => {
	it('should replace the version and keep the tab indentation and the other fields', () => {
		const manifestText =
			'{\n\t"Name": "Keys",\n\t"Version": "1.0.0",\n\t"Icon": "icon.png"\n}\n';

		expect(setManifestVersion({ manifestText, version: '2.3.4' })).toBe(
			'{\n\t"Name": "Keys",\n\t"Version": "2.3.4",\n\t"Icon": "icon.png"\n}\n'
		);
	});

	it('should fail when the manifest has no version', () => {
		expect(() =>
			setManifestVersion({ manifestText: '{}', version: '1.0.0' })
		).toThrow(ManifestVersionError);
	});
});
