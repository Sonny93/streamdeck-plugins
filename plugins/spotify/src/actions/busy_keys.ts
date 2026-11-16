/** Remembers which keys have a task running, so a periodic job can skip a key whose previous task has not finished. */
export class BusyKeys {
	private readonly runningCounts = new Map<string, number>();

	isBusy(key: string): boolean {
		return (this.runningCounts.get(key) ?? 0) > 0;
	}

	/** Runs the task and keeps the key busy until it settles. */
	async track<TResult>(
		key: string,
		task: () => Promise<TResult>
	): Promise<TResult> {
		this.runningCounts.set(key, (this.runningCounts.get(key) ?? 0) + 1);
		try {
			return await task();
		} finally {
			const remaining = (this.runningCounts.get(key) ?? 1) - 1;
			if (remaining === 0) {
				this.runningCounts.delete(key);
			} else {
				this.runningCounts.set(key, remaining);
			}
		}
	}
}
