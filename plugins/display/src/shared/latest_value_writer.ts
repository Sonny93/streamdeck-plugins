/**
 * Writes values with a slow writer, skipping those overtaken by a newer one while a write runs.
 * A dial turned quickly asks for many values; the monitor only receives the one in flight and the last one.
 */
export class LatestValueWriter {
	private next: number | undefined;
	private inFlight: number | undefined;
	private draining: Promise<void> | undefined;

	constructor(private readonly write: (value: number) => Promise<void>) {}

	/** Value asked for and not written yet, `undefined` once every write is done. */
	get pendingValue(): number | undefined {
		return this.next ?? this.inFlight;
	}

	/** Asks for a value; resolves once it, or a newer one, is written, and rejects when a write fails. */
	request(value: number): Promise<void> {
		this.next = value;
		this.draining ??= this.drain().finally(() => {
			this.draining = undefined;
		});
		return this.draining;
	}

	private async drain(): Promise<void> {
		while (this.next !== undefined) {
			const value = this.next;
			this.next = undefined;
			this.inFlight = value;
			try {
				await this.write(value);
			} catch (error) {
				this.next = undefined;
				throw error;
			} finally {
				this.inFlight = undefined;
			}
		}
	}
}
