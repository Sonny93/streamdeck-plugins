/** Raised when an action works on a monitor Windows does not light anymore, or on a change the monitor cannot make. */
export class MonitorUnavailableError extends Error {
	readonly code = 'E_MONITOR_UNAVAILABLE';
	override readonly name = 'MonitorUnavailableError';

	constructor(options: Readonly<{ monitorId: string; reason: string }>) {
		super(`${options.reason}: ${options.monitorId}`);
	}
}
