import type { ListenContext } from './listen_context';
import { ListenSettings } from './listen_settings';
import { pause } from './pause';

type PollBudget = Readonly<{ attempts: number; delayMilliseconds: number }>;

const READ_BACK_BUDGET: PollBudget = {
	attempts: ListenSettings.readBackAttempts,
	delayMilliseconds: ListenSettings.readBackDelayMilliseconds,
};

/** Runs the read until it returns a value, pausing between the reads; resolves `undefined` when no read did within the budget. */
export async function pollUntil<TValue>(
	context: ListenContext,
	read: () => Promise<TValue | undefined>,
	budget: PollBudget = READ_BACK_BUDGET
): Promise<TValue | undefined> {
	for (let attempt = 1; attempt <= budget.attempts; attempt++) {
		const value = await read();
		if (value !== undefined) {
			return value;
		}
		if (attempt < budget.attempts) {
			await pause(context.schedule, budget.delayMilliseconds);
		}
	}
	return undefined;
}
