/** Runs async tasks one after the other, in the order they were added; a failed task does not stop the next ones. */
export class SerialQueue {
	private tail: Promise<unknown> = Promise.resolve();

	run<TResult>(task: () => Promise<TResult>): Promise<TResult> {
		const result = this.tail.then(task);
		this.tail = result.catch(() => undefined);
		return result;
	}
}
