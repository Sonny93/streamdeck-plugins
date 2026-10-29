import { describe, expect, it } from 'vitest';

import { LatestValueWriter } from './latest_value_writer';

function createSlowWriter() {
	const written: number[] = [];
	const finishers: Array<() => void> = [];
	const writer = new LatestValueWriter(
		(value) =>
			new Promise((resolve) => {
				finishers.push(() => {
					written.push(value);
					resolve();
				});
			})
	);
	const finishNext = async (): Promise<void> => {
		finishers.shift()?.();
		await new Promise((resolve) => {
			setImmediate(resolve);
		});
	};
	return { writer, written, finishNext };
}

describe('LatestValueWriter', () => {
	it('writes the value in flight and the last one, skipping those in between', async () => {
		const { writer, written, finishNext } = createSlowWriter();

		const done = writer.request(10);
		void writer.request(15);
		void writer.request(20);
		expect(writer.pendingValue).toBe(20);

		await finishNext();
		await finishNext();
		await done;

		expect(written).toEqual([10, 20]);
		expect(writer.pendingValue).toBeUndefined();
	});

	it('stops at a failed write and forgets the values asked meanwhile', async () => {
		const writer = new LatestValueWriter(() =>
			Promise.reject(new RangeError('refused'))
		);

		await expect(writer.request(10)).rejects.toThrow('refused');
		expect(writer.pendingValue).toBeUndefined();
	});
});
