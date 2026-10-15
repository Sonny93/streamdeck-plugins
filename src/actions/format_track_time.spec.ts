import { describe, expect, it } from 'vitest';

import { formatTrackTime } from './format_track_time';

describe('formatTrackTime', () => {
	it('should show minutes and padded seconds', () => {
		expect(formatTrackTime(219_378)).toBe('3:39');
	});

	it('should show zero minutes under one minute', () => {
		expect(formatTrackTime(5_999)).toBe('0:05');
	});

	it('should show hours from one hour on', () => {
		expect(formatTrackTime(3_723_000)).toBe('1:02:03');
	});

	it('should show a negative time as zero', () => {
		expect(formatTrackTime(-500)).toBe('0:00');
	});
});
