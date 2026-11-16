import { describe, expect, it, vi } from 'vitest';

import { createRenderErrorReporter } from './create_render_error_reporter';

describe('createRenderErrorReporter', () => {
	it('should log an error message once', () => {
		const log = vi.fn();
		const report = createRenderErrorReporter(log);

		report(new Error('boom'));
		report(new Error('boom'));

		expect(log).toHaveBeenCalledOnce();
	});

	it('should log a different message again', () => {
		const log = vi.fn();
		const report = createRenderErrorReporter(log);

		report(new Error('boom'));
		report(new Error('crash'));

		expect(log).toHaveBeenCalledTimes(2);
	});
});
