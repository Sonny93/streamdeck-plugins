import { describe, expect, it, vi } from 'vitest';

import { createKdotoolMissingReporter } from './create_kdotool_missing_reporter';
import { KdotoolMissingError } from './kdotool_missing_error';

describe('createKdotoolMissingReporter', () => {
	it('should log the install hint once however often kdotool is missing', () => {
		const log = vi.fn();
		const report = createKdotoolMissingReporter(log);
		const error = new KdotoolMissingError({ cause: undefined });

		report(error);
		report(error);

		expect(log.mock.calls).toStrictEqual([
			['Install kdotool (AUR) to raise the Spotify window on KDE Wayland.'],
		]);
	});

	it('should not log for another error', () => {
		const log = vi.fn();

		createKdotoolMissingReporter(log)(new Error('boom'));

		expect(log).not.toHaveBeenCalled();
	});
});
