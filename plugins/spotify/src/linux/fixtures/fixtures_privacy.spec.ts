import { describe, expect, it } from 'vitest';

import { FIREFOX_AND_SPOTIFY_CLIENT_LISTING } from './firefox_and_spotify_client_listing';
import { FIREFOX_AND_SPOTIFY_SINK_INPUT_LISTING } from './firefox_and_spotify_sink_input_listing';

const FIXTURES = [
	FIREFOX_AND_SPOTIFY_CLIENT_LISTING,
	FIREFOX_AND_SPOTIFY_SINK_INPUT_LISTING,
].map((fixture) => JSON.stringify(fixture));

const SCRUBBED_VALUES: Readonly<Record<string, string>> = {
	'application.process.user': 'user',
	'application.process.host': 'example-host',
	'application.process.machine_id': '0'.repeat(32),
	'application.language': 'en_US.UTF-8',
	'application.process.id': '4242',
	'pipewire.sec.pid': '4242',
	'media.name': 'Example track',
};

function readValues(fixture: string, key: string): string[] {
	const pattern = new RegExp(`"${key.replaceAll('.', '\\.')}":"([^"]*)"`, 'g');
	return [...fixture.matchAll(pattern)].map((match) => match[1] ?? '');
}

describe('the pactl fixtures', () => {
	it.each(Object.entries(SCRUBBED_VALUES))(
		'should hold only the placeholder in %s',
		(key, placeholder) => {
			const values = FIXTURES.flatMap((fixture) => readValues(fixture, key));

			expect(values.length).toBeGreaterThan(0);
			expect(values.filter((value) => value !== placeholder)).toStrictEqual([]);
		}
	);

	it('should not name a home directory or embed a user name in the core name', () => {
		expect(
			FIXTURES.filter((fixture) =>
				/\/home\/|"core\.name":"pipewire-(?!user-)/.test(fixture)
			)
		).toStrictEqual([]);
	});
});
