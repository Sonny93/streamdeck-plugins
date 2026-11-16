type ConcurrencyLimiter = <TValue>(
	task: () => Promise<TValue>
) => Promise<TValue>;

/** Builds a function that runs tasks at most `maximumConcurrent` at a time, the others waiting in order. */
export function createConcurrencyLimiter(
	maximumConcurrent: number
): ConcurrencyLimiter {
	const waiting: Array<() => void> = [];
	let running = 0;

	function release(): void {
		running -= 1;
		waiting.shift()?.();
	}

	async function acquire(): Promise<void> {
		if (running < maximumConcurrent) {
			running += 1;
			return;
		}
		await new Promise<void>((resolve) => {
			waiting.push(resolve);
		});
		running += 1;
	}

	return async (task) => {
		await acquire();
		try {
			return await task();
		} finally {
			release();
		}
	};
}
