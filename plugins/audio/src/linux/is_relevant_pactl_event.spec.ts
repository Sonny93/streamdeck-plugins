import { describe, expect, it } from 'vitest';

import { isRelevantPactlEvent } from './is_relevant_pactl_event';

describe('isRelevantPactlEvent', () => {
	it.each([
		"Event 'change' on sink #66",
		"Event 'change' on source #70",
		"Event 'change' on server",
		"Event 'new' on sink #80",
		"Event 'remove' on source #71",
	])('should accept %s', (line) => {
		expect(isRelevantPactlEvent(line)).toBe(true);
	});

	it.each([
		"Event 'change' on sink-input #12",
		"Event 'new' on source-output #3",
		"Event 'change' on client #9",
		"Event 'change' on card #1",
		'something else',
		'',
	])('should ignore %s', (line) => {
		expect(isRelevantPactlEvent(line)).toBe(false);
	});
});
