import type { CommandRunner } from 'deck-kit/process/run_command';

import type { KscreenOutput } from './kscreen_output';
import { parseKscreenOutputs } from './parse_kscreen_outputs';

const COMMAND = 'kscreen-doctor';

/** Reads and changes the outputs of KWin through `kscreen-doctor`; the connectors come from its own listing, which only keeps plain names. */
export class KscreenDoctor {
	constructor(private readonly runCommand: CommandRunner) {}

	async listOutputs(): Promise<KscreenOutput[]> {
		const json = await this.runCommand({ command: COMMAND, args: ['-j'] });
		return parseKscreenOutputs(json);
	}

	async setBrightness(connector: string, percent: number): Promise<void> {
		await this.apply(connector, `brightness.${String(Math.round(percent))}`);
	}

	async setSdrBrightness(connector: string, nits: number): Promise<void> {
		await this.apply(connector, `sdr-brightness.${String(Math.round(nits))}`);
	}

	async setHdr(connector: string, isEnabled: boolean): Promise<void> {
		await this.apply(connector, `hdr.${isEnabled ? 'enable' : 'disable'}`);
	}

	private async apply(connector: string, setting: string): Promise<void> {
		await this.runCommand({
			command: COMMAND,
			args: [`output.${connector}.${setting}`],
		});
	}
}
