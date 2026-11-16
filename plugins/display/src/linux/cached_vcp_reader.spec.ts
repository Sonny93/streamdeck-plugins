import { CommandFailedError } from 'deck-kit/process/command_failed_error';
import { describe, expect, it, vi } from 'vitest';

import type { VcpReply } from '../displays/vcp_reply';
import { CachedVcpReader } from './cached_vcp_reader';

const INTERVAL = 15_000;
const BRIGHTNESS = 0x10;
const POWER = 0xd6;

function createReader(
	fetch: (codes: readonly number[]) => Promise<ReadonlyMap<number, VcpReply>>
) {
	let time = 0;
	const reader = new CachedVcpReader({
		fetch,
		now: () => time,
		refreshIntervalMilliseconds: () => INTERVAL,
	});
	return {
		reader,
		advance: (milliseconds: number) => {
			time += milliseconds;
		},
	};
}

describe('CachedVcpReader', () => {
	it('should fetch once for reads closer than the interval', async () => {
		const fetch = vi.fn(() =>
			Promise.resolve(new Map([[BRIGHTNESS, { current: 40, maximum: 100 }]]))
		);
		const { reader, advance } = createReader(fetch);

		await reader.read(BRIGHTNESS, [BRIGHTNESS]);
		advance(INTERVAL - 1);
		const reply = await reader.read(BRIGHTNESS, [BRIGHTNESS]);

		expect(fetch).toHaveBeenCalledTimes(1);
		expect(reply).toEqual({ current: 40, maximum: 100 });
	});

	it('should fetch again once the interval has passed', async () => {
		const fetch = vi.fn(() =>
			Promise.resolve(new Map([[BRIGHTNESS, { current: 40, maximum: 100 }]]))
		);
		const { reader, advance } = createReader(fetch);

		await reader.read(BRIGHTNESS, [BRIGHTNESS]);
		advance(INTERVAL);
		await reader.read(BRIGHTNESS, [BRIGHTNESS]);

		expect(fetch).toHaveBeenCalledTimes(2);
	});

	it('should keep the last answer and wait for the interval when the monitor stops answering', async () => {
		const fetch = vi
			.fn<() => Promise<ReadonlyMap<number, VcpReply>>>()
			.mockResolvedValueOnce(new Map([[POWER, { current: 1, maximum: 0 }]]))
			.mockRejectedValue(
				new CommandFailedError({ command: 'ddcutil', args: [], cause: 'off' })
			);
		const { reader, advance } = createReader(fetch);
		await reader.read(POWER, [POWER]);

		advance(INTERVAL);
		const reply = await reader.read(POWER, [POWER]);
		await reader.read(POWER, [POWER]);

		expect(reply).toEqual({ current: 1, maximum: 0 });
		expect(fetch).toHaveBeenCalledTimes(2);
	});

	it('should count a written value as a fresh answer', async () => {
		const fetch = vi.fn(() => Promise.resolve(new Map<number, VcpReply>()));
		const { reader } = createReader(fetch);

		reader.remember(BRIGHTNESS, { current: 70, maximum: 100 });
		const reply = await reader.read(BRIGHTNESS, [BRIGHTNESS]);

		expect(fetch).not.toHaveBeenCalled();
		expect(reply).toEqual({ current: 70, maximum: 100 });
	});

	it('should not hide an error that is not a failed command', async () => {
		const { reader } = createReader(() =>
			Promise.reject(new RangeError('bug'))
		);

		await expect(reader.read(POWER, [POWER])).rejects.toBeInstanceOf(
			RangeError
		);
	});
});
