import type { ListenContext } from './listen_context';
import { ListenSettings } from './listen_settings';
import { pause } from './pause';

/** Runs the read until it returns a value, pausing between the reads; resolves `undefined` when no read did within the attempts. */
export async function pollUntil<TValue>(
	context: ListenContext,
	read: () => Promise<TValue | undefined>
): Promise<TValue | undefined> {
	for (let attempt = 1; attempt <= ListenSettings.readBackAttempts; attempt++) {
		const value = await read();
		if (value !== undefined) {
			return value;
		}
		if (attempt < ListenSettings.readBackAttempts) {
			await pause(context.schedule, ListenSettings.readBackDelayMilliseconds);
		}
	}
	return undefined;
}
