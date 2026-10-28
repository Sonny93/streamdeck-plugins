import { describe, expect, it } from 'vitest';

import { parseBrowserProcessId } from './parse_browser_process_id';
import { SpotifyInvalidResponseError } from './spotify_invalid_response_error';

const BROWSER_PROCESS_ID = 4321;

function buildProcessInfo(type: string, id: number) {
	return { type, id, cpuTime: 1.5 };
}

describe('parseBrowserProcessId', () => {
	it('should return the id of the browser process', () => {
		const rawResult = {
			processInfo: [
				buildProcessInfo('renderer', 11),
				buildProcessInfo('browser', BROWSER_PROCESS_ID),
				buildProcessInfo('gpu', 12),
			],
		};

		expect(parseBrowserProcessId(rawResult)).toBe(BROWSER_PROCESS_ID);
	});

	it('should throw an invalid response error when there is no browser process', () => {
		const rawResult = { processInfo: [buildProcessInfo('renderer', 11)] };

		expect(() => parseBrowserProcessId(rawResult)).toThrow(
			SpotifyInvalidResponseError
		);
	});

	it('should throw an invalid response error when the result has an unexpected shape', () => {
		expect(() => parseBrowserProcessId({ processInfo: 'nope' })).toThrow(
			SpotifyInvalidResponseError
		);
	});
});
