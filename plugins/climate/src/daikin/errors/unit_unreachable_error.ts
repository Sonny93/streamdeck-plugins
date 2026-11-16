import { DaikinError } from './daikin_error';

export type UnitUnreachableOptions = {
	readonly mayHaveReachedUnit?: boolean;
	readonly cause?: unknown;
};

/**
 * Network error or timeout. `mayHaveReachedUnit` is false only when the connection
 * was definitely never established (refused, unknown host, no route).
 */
export class UnitUnreachableError extends DaikinError {
	readonly code = 'E_UNIT_UNREACHABLE';
	readonly host: string;
	readonly mayHaveReachedUnit: boolean;

	constructor(host: string, options: Readonly<UnitUnreachableOptions> = {}) {
		super(`Unit ${host} is unreachable`, { cause: options.cause });
		this.host = host;
		this.mayHaveReachedUnit = options.mayHaveReachedUnit ?? true;
	}
}
