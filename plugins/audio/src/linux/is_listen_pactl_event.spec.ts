import { describe, expect, it } from 'vitest';

import { isListenPactlEvent } from './is_listen_pactl_event';

describe('isListenPactlEvent', () => {
	it.each([
		"Event 'change' on source #70",
		"Event 'new' on module #536870916",
		"Event 'remove' on module #536870916",
		"Event 'change' on source-output #3",
		"Event 'new' on sink-input #12",
	])('should accept %s', (line) => {
		expect(isListenPactlEvent(line)).toBe(true);
	});

	it.each([
		"Event 'change' on sink #66",
		"Event 'change' on server",
		"Event 'change' on client #9",
		"Event 'change' on card #1",
		'something else',
		'',
	])('should ignore %s', (line) => {
		expect(isListenPactlEvent(line)).toBe(false);
	});
});
