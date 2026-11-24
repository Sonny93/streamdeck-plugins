import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const FIXTURES_DIRECTORIES = [
	path.resolve(import.meta.dirname, 'fixtures'),
	path.resolve(import.meta.dirname, 'listen/fixtures'),
];
const REAL_SERIAL = ['244820', '36079480'].join('');

describe('linux fixtures', () => {
	it('should not hold the serial number of a real device', () => {
		const leaking = FIXTURES_DIRECTORIES.flatMap((directory) =>
			readdirSync(directory)
				.map((name) => path.join(directory, name))
				.filter((file) => readFileSync(file, 'utf8').includes(REAL_SERIAL))
		);

		expect(leaking).toEqual([]);
	});
});
