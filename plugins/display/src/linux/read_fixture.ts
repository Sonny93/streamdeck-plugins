import { readFileSync } from 'node:fs';

/** Reads a capture of a real command or file from the `fixtures` folder, for tests. */
export function readFixture(name: string): string {
	return readFileSync(new URL(`./fixtures/${name}`, import.meta.url), 'utf8');
}

/** Reads an EDID capture stored as hex digits, for tests. */
export function readEdidFixture(name: string): Uint8Array {
	return Uint8Array.from(Buffer.from(readFixture(name).trim(), 'hex'));
}
