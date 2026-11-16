import type { CommandRunner } from 'deck-kit/process/run_command';

import type { VcpReply } from '../displays/vcp_reply';
import { SerialQueue } from '../shared/serial_queue';
import { parseDdcutilCapabilities } from './parse_ddcutil_capabilities';
import { parseDdcutilDetect } from './parse_ddcutil_detect';
import { parseDdcutilGetvcp } from './parse_ddcutil_getvcp';

const COMMAND = 'ddcutil';
const HEX_RADIX = 16;
const VCP_CODE_DIGITS = 2;
const SLOW_COMMAND_TIMEOUT_MILLISECONDS = 20_000;

function formatVcpCode(code: number): string {
	return code.toString(HEX_RADIX).toUpperCase().padStart(VCP_CODE_DIGITS, '0');
}

/**
 * Talks DDC/CI through `ddcutil`. The commands for one bus run one after the other, as a bus takes one exchange at a time;
 * different buses run in parallel. The buses and VCP codes come from the monitor listing and the plugin constants, never from settings.
 */
export class Ddcutil {
	private readonly queues = new Map<number, SerialQueue>();

	constructor(private readonly runCommand: CommandRunner) {}

	/** Maps the DRM connectors to the I2C bus of their DDC/CI channel. */
	async detect(): Promise<Map<string, number>> {
		const output = await this.runCommand({
			command: COMMAND,
			args: ['detect', '--terse'],
			timeoutMilliseconds: SLOW_COMMAND_TIMEOUT_MILLISECONDS,
		});
		return parseDdcutilDetect(output);
	}

	/** Reads VCP features without the checks that make `ddcutil` ask the monitor twice. */
	getVcp(
		busNumber: number,
		codes: readonly number[]
	): Promise<Map<number, VcpReply>> {
		return this.onBus(busNumber, async () =>
			parseDdcutilGetvcp(
				await this.runCommand({
					command: COMMAND,
					args: [
						'getvcp',
						...codes.map(formatVcpCode),
						'--bus',
						String(busNumber),
						'--brief',
						'--skip-ddc-checks',
					],
				})
			)
		);
	}

	setVcp(busNumber: number, code: number, value: number): Promise<void> {
		return this.onBus(busNumber, async () => {
			await this.runCommand({
				command: COMMAND,
				args: [
					'setvcp',
					formatVcpCode(code),
					String(Math.round(value)),
					'--bus',
					String(busNumber),
				],
			});
		});
	}

	/** Reads the raw MCCS capabilities string of a monitor. */
	capabilities(busNumber: number): Promise<string | undefined> {
		return this.onBus(busNumber, async () =>
			parseDdcutilCapabilities(
				await this.runCommand({
					command: COMMAND,
					args: ['capabilities', '--bus', String(busNumber), '--verbose'],
					timeoutMilliseconds: SLOW_COMMAND_TIMEOUT_MILLISECONDS,
				})
			)
		);
	}

	private onBus<TResult>(
		busNumber: number,
		task: () => Promise<TResult>
	): Promise<TResult> {
		let queue = this.queues.get(busNumber);
		if (queue === undefined) {
			queue = new SerialQueue();
			this.queues.set(busNumber, queue);
		}
		return queue.run(task);
	}
}
