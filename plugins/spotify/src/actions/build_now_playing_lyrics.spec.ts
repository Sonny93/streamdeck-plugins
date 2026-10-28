import { describe, expect, it } from 'vitest';

import { buildNowPlayingLyrics } from './build_now_playing_lyrics';

const LINES = [
	{ startMilliseconds: 1_000, words: 'First' },
	{ startMilliseconds: 3_000, words: '' },
	{ startMilliseconds: 5_000, words: 'Last' },
];

function build(positionMilliseconds: number) {
	return buildNowPlayingLyrics({ lines: LINES, positionMilliseconds });
}

describe('buildNowPlayingLyrics', () => {
	it('should show nothing without lines', () => {
		expect(
			buildNowPlayingLyrics({ lines: [], positionMilliseconds: 0 })
		).toBeUndefined();
	});

	it('should show a note and the first line before the first line starts', () => {
		expect(build(500)).toEqual({ current: '♪', next: 'First' });
	});

	it('should show the line that started last and the one after it', () => {
		expect(build(1_000)).toEqual({ current: 'First', next: '♪' });
	});

	it('should show a note for a line without words', () => {
		expect(build(4_000)).toEqual({ current: '♪', next: 'Last' });
	});

	it('should show no next line after the last one started', () => {
		expect(build(9_000)).toEqual({ current: 'Last', next: undefined });
	});
});
