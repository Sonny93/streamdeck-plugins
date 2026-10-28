import { describe, expect, it } from 'vitest';

import { truncateText } from './truncate_text';

describe('truncateText', () => {
	it('should keep a text that fits', () => {
		expect(truncateText({ text: 'Road trip', maxLength: 9 })).toBe('Road trip');
	});

	it('should cut a longer text and end it with an ellipsis within the maximum length', () => {
		expect(truncateText({ text: 'Road trip 2024', maxLength: 10 })).toBe(
			'Road trip…'
		);
	});

	it('should not leave a space before the ellipsis', () => {
		expect(truncateText({ text: 'Road trip 2024', maxLength: 11 })).toBe(
			'Road trip…'
		);
	});

	it('should count a character outside the basic plane once', () => {
		expect(truncateText({ text: '😀😀😀😀', maxLength: 3 })).toBe('😀😀…');
	});
});
