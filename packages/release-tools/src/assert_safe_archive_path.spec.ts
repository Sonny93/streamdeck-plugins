import { describe, expect, it } from 'vitest';

import { assertSafeArchivePath } from './assert_safe_archive_path.ts';
import { UnsafeArchivePathError } from './unsafe_archive_path_error.ts';

describe('assertSafeArchivePath', () => {
	it.each(['package.json', 'Profiles/', 'Profiles/A.sdProfile/Images/a.png'])(
		'should accept %s',
		(entryName) => {
			expect(() => assertSafeArchivePath({ entryName })).not.toThrow();
		}
	);

	it.each([
		'',
		'/etc/passwd',
		'../outside.txt',
		'folder/../../outside.txt',
		'./a.txt',
		'folder//a.txt',
		'C:/Windows/a.txt',
		'folder\\a.txt',
		'a\u0000b',
	])('should reject %j', (entryName) => {
		expect(() => assertSafeArchivePath({ entryName })).toThrow(
			UnsafeArchivePathError
		);
	});
});
