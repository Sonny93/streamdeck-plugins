/** Runs tasks one after the other, whether the previous one succeeded or not. */
export class SerialQueue {
	private last: Promise<unknown> = Promise.resolve();

	enqueue<TResult>(task: () => Promise<TResult>): Promise<TResult> {
		const queued = this.last.then(task);
		this.last = queued.catch(() => undefined);
		return queued;
	}
}
