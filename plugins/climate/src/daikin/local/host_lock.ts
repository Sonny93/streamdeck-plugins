const queueTailByHost = new Map<string, Promise<void>>();

function ignoreOutcome(): void {}

/** Runs tasks for the same host one at a time, in call order. A failing task does not block the next. */
export function withHostLock<TValue>(
	host: string,
	task: () => Promise<TValue>
): Promise<TValue> {
	const previousTail = queueTailByHost.get(host) ?? Promise.resolve();
	const outcome = previousTail.then(task);
	const tail = outcome.then(ignoreOutcome, ignoreOutcome);
	queueTailByHost.set(host, tail);
	void tail.then(() => {
		if (queueTailByHost.get(host) === tail) queueTailByHost.delete(host);
	});
	return outcome;
}
