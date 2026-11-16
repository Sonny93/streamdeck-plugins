import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const FIXTURES_DIRECTORY = path.resolve(import.meta.dirname, 'fixtures');
const REAL_SERIAL = ['244820', '36079480'].join('');

describe('linux fixtures', () => {
	it('should not hold the serial number of a real device', () => {
		const leaking = readdirSync(FIXTURES_DIRECTORY).filter((name) =>
			readFileSync(path.join(FIXTURES_DIRECTORY, name), 'utf8').includes(
				REAL_SERIAL
			)
		);

		expect(leaking).toEqual([]);
	});
});
