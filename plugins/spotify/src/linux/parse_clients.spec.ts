import { describe, expect, it } from 'vitest';

import { FIREFOX_AND_SPOTIFY_CLIENT_LISTING } from './fixtures/firefox_and_spotify_client_listing';
import { parseClients } from './parse_clients';

describe('parseClients', () => {
	it('should map the real clients to their binary and process', () => {
		expect([...parseClients(FIREFOX_AND_SPOTIFY_CLIENT_LISTING)]).toStrictEqual(
			[
				[84, { binary: 'firefox', processId: 4242 }],
				[592, { binary: 'spotify', processId: 4242 }],
			]
		);
	});

	it('should keep a client that only names its process', () => {
		expect(
			parseClients([
				{ index: 3, properties: { 'application.process.id': '77' } },
			]).get(3)
		).toStrictEqual({ binary: undefined, processId: 77 });
	});

	it('should leave out a client with neither a binary nor a process', () => {
		expect(parseClients([{ index: 3, properties: {} }]).size).toBe(0);
	});

	it('should return nothing for output that is not a list', () => {
		expect(parseClients({ error: 'boom' }).size).toBe(0);
	});
});
