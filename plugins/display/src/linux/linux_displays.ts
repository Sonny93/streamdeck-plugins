import { CommandFailedError } from 'deck-kit/process/command_failed_error';

import type { DisplayInfo } from '../displays/display_info';
import { buildEdidMonitorId } from './build_edid_monitor_id';
import type { Ddcutil } from './ddcutil';
import type { EdidInfo } from './edid_info';
import type { KscreenDoctor } from './kscreen_doctor';
import type { KscreenOutput } from './kscreen_output';
import { parseEdid } from './parse_edid';

const IDENTITY_RETRY_MILLISECONDS = 30_000;

type LinuxDisplaysOptions = Readonly<{
	kscreen: KscreenDoctor;
	ddcutil: Ddcutil;
	readEdid: (connector: string) => Promise<Uint8Array | undefined>;
	now: () => number;
}>;

function uniqueIds(
	entries: readonly Readonly<{ connector: string; id: string }>[]
): ReadonlyMap<string, string> {
	return new Map(
		entries.map(({ connector, id }) => [
			connector,
			entries.filter((other) => other.id === id).length > 1
				? `${id}-${connector}`
				: id,
		])
	);
}

/**
 * Lists the enabled outputs of KWin as monitors.
 * What identifies them (EDID, I2C bus) is read again only when the set of outputs changes, as it takes a `ddcutil detect`.
 */
export class LinuxDisplays {
	private outputs: ReadonlyMap<string, KscreenOutput> = new Map();
	private signature: string | undefined;
	private failedDetection:
		| Readonly<{ signature: string; at: number }>
		| undefined;
	private buses: ReadonlyMap<string, number> = new Map();
	private edids: ReadonlyMap<string, EdidInfo | undefined> = new Map();

	constructor(private readonly options: LinuxDisplaysOptions) {}

	/** The output with this connector in the latest listing. */
	outputOf(connector: string): KscreenOutput | undefined {
		return this.outputs.get(connector);
	}

	async list(): Promise<DisplayInfo[]> {
		const outputs = await this.options.kscreen.listOutputs();
		this.outputs = new Map(outputs.map((output) => [output.connector, output]));
		await this.refreshIdentities(outputs);
		const ids = uniqueIds(
			outputs.map((output) => ({
				connector: output.connector,
				id: this.idOf(output.connector),
			}))
		);
		return outputs.map((output) => this.buildDisplay(output, ids));
	}

	private idOf(connector: string): string {
		const edid = this.edids.get(connector);
		return edid === undefined ? connector : buildEdidMonitorId(edid);
	}

	private buildDisplay(
		output: KscreenOutput,
		ids: ReadonlyMap<string, string>
	): DisplayInfo {
		const edid = this.edids.get(output.connector);
		return {
			id: ids.get(output.connector) ?? output.connector,
			model: edid?.model ?? output.connector,
			manufacturerId: edid?.manufacturerId ?? '',
			productCode: edid?.productCode ?? '',
			portName: output.connector,
			bounds: output.bounds,
			isPrimary: output.isPrimary,
			hdr: output.hdr,
			platform: {
				kind: 'linux',
				connector: output.connector,
				busNumber: this.buses.get(output.connector),
			},
		};
	}

	private async refreshIdentities(
		outputs: readonly KscreenOutput[]
	): Promise<void> {
		const signature = outputs
			.map((output) => output.connector)
			.toSorted()
			.join(',');
		if (
			signature === this.signature ||
			this.isDetectionRetryTooSoon(signature)
		) {
			return;
		}
		this.edids = await this.readEdids(outputs);
		try {
			this.buses = await this.options.ddcutil.detect();
			this.signature = signature;
			this.failedDetection = undefined;
		} catch (error) {
			if (!(error instanceof CommandFailedError)) {
				throw error;
			}
			this.buses = new Map();
			this.signature = undefined;
			this.failedDetection = { signature, at: this.options.now() };
		}
	}

	private async readEdids(
		outputs: readonly KscreenOutput[]
	): Promise<ReadonlyMap<string, EdidInfo | undefined>> {
		const entries = await Promise.all(
			outputs.map(async ({ connector }) => {
				const bytes = await this.options.readEdid(connector);
				return [
					connector,
					bytes === undefined ? undefined : parseEdid(bytes),
				] as const;
			})
		);
		return new Map(entries);
	}

	/** A failed `ddcutil detect` is retried at an interval, not at every poll, while the outputs stay the same. */
	private isDetectionRetryTooSoon(signature: string): boolean {
		return (
			this.failedDetection?.signature === signature &&
			this.options.now() - this.failedDetection.at < IDENTITY_RETRY_MILLISECONDS
		);
	}
}
