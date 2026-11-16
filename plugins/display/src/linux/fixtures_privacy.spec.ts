import { readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { readFixture } from './read_fixture';

const FIXTURES_DIRECTORY = new URL('./fixtures/', import.meta.url);
const HEX_FILE = /\.hex$/u;
/** Built from pieces so this file does not hold the text it forbids. */
const FORBIDDEN = [
	['1154', '3801012'].join(''),
	['H1AK', '5'].join(''),
	['/ho', 'me/'].join(''),
] as const;

function readText(name: string): string {
	const content = readFixture(name);
	return HEX_FILE.test(name)
		? Buffer.from(content.trim(), 'hex').toString('latin1')
		: content;
}

describe('the Linux fixtures', () => {
	it('should hold no real serial number and no personal path', () => {
		const leaks = readdirSync(FIXTURES_DIRECTORY).flatMap((name) =>
			FORBIDDEN.filter((text) => readText(name).includes(text)).map(
				(text) => `${name}: ${text}`
			)
		);

		expect(leaks).toEqual([]);
	});
});
