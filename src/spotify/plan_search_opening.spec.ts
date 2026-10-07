import { describe, expect, it } from 'vitest';

import { planSearchOpening } from './plan_search_opening';

describe('planSearchOpening', () => {
	it('should send the shortcut when the modal input does not exist', () => {
		expect(planSearchOpening({ hasModalInput: false })).toBe('send-shortcut');
	});

	it('should close the modal when the modal input already exists', () => {
		expect(planSearchOpening({ hasModalInput: true })).toBe('close-modal');
	});
});
