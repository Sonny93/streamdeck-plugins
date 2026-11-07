import { ElgatoAudioRestartTimeoutError } from './elgato_audio_restart_timeout_error';
import type { ElgatoAudioRestarterOptions } from './elgato_audio_restarter_options';

/** What a call to `restart` did: it ran to the end, or it was ignored because a restart was already in progress. */
export type ElgatoAudioRestartOutcome = 'restarted' | 'ignored';

/**
 * Restarts the Elgato audio server by killing it and waiting for Elgato's own service to start it again.
 * A server that was not running is only waited for, and a restart asked while another one runs is ignored.
 */
export class ElgatoAudioRestarter {
	private isRestarting = false;

	constructor(private readonly options: ElgatoAudioRestarterOptions) {}

	/** Rejects with `ElgatoAudioProcessError` when the process cannot be listed or killed, and with `ElgatoAudioRestartTimeoutError` when it never comes back. */
	async restart(): Promise<ElgatoAudioRestartOutcome> {
		if (this.isRestarting) {
			return 'ignored';
		}
		this.isRestarting = true;
		try {
			await this.killAndWaitForServer();
			return 'restarted';
		} finally {
			this.isRestarting = false;
		}
	}

	private async killAndWaitForServer(): Promise<void> {
		const { serverProcess } = this.options;
		if (await serverProcess.isRunning()) {
			await this.killServer();
		}
		await this.waitForServer();
	}

	private async killServer(): Promise<void> {
		const { serverProcess } = this.options;
		try {
			await serverProcess.kill();
		} catch (error) {
			if (await serverProcess.isRunning()) {
				throw error;
			}
		}
	}

	private async waitForServer(): Promise<void> {
		const {
			serverProcess,
			pollIntervalMilliseconds,
			restartTimeoutMilliseconds,
		} = this.options;
		for (
			let waited = 0;
			waited < restartTimeoutMilliseconds;
			waited += pollIntervalMilliseconds
		) {
			await this.sleep(pollIntervalMilliseconds);
			if (await serverProcess.isRunning()) {
				return;
			}
		}
		throw new ElgatoAudioRestartTimeoutError(restartTimeoutMilliseconds);
	}

	private sleep(delayMilliseconds: number): Promise<void> {
		return new Promise((resolve) => {
			this.options.schedule(resolve, delayMilliseconds);
		});
	}
}
