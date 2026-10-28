import type { VoltState } from './volt_state';
import type { VoltStatus } from './volt_status';
import type { VoltButton } from './volt_button';
import type { VoltConnection } from './volt_connection';
import type { VoltHubOptions } from './volt_hub_options';
import { isSameVoltStatus } from './is_same_volt_status';
import { parseVoltStateReport } from './parse_volt_state_report';
import { VoltStateUnknownError } from './volt_state_unknown_error';
import { VoltNotConnectedError } from './volt_not_connected_error';
import { buildVoltSettingsReport } from './build_volt_settings_report';

type VoltStatusListener = (status: VoltStatus) => void;

type ReadyLink = Readonly<{ connection: VoltConnection; state: VoltState }>;

/**
 * Shares one link to the Volt 1 between every action.
 * It follows the button states from the reports of the Volt 1, reconnects after an unplug,
 * and applies button changes one at a time, each built on the state left by the previous one.
 */
export class VoltHub {
	private readonly listeners = new Set<VoltStatusListener>();
	private status: VoltStatus = { kind: 'disconnected' };
	private connection: VoltConnection | undefined;
	private lastChange: Promise<unknown> = Promise.resolve();
	private isStarted = false;

	constructor(private readonly options: VoltHubOptions) {}

	get current(): VoltStatus {
		return this.status;
	}

	/** Starts looking for the Volt 1; the link then lives as long as the plugin. */
	start(): void {
		if (this.isStarted) {
			return;
		}
		this.isStarted = true;
		void this.connect();
	}

	/** Registers a listener, calls it right away with the current status, and returns the function that unsubscribes it. */
	subscribe(listener: VoltStatusListener): () => void {
		this.listeners.add(listener);
		listener(this.status);
		return () => {
			this.listeners.delete(listener);
		};
	}

	/** Flips a button once the changes asked before are applied, and resolves with its new value. */
	toggleButton(button: VoltButton): Promise<boolean> {
		const change = this.lastChange.then(async () => {
			const { connection, state } = this.readReadyLink();
			const isOn = !state[button];
			const nextState = { ...state, [button]: isOn };
			await connection.writeReport(buildVoltSettingsReport(nextState));
			this.publish({ kind: 'ready', state: nextState });
			return isOn;
		});
		this.lastChange = change.catch(() => undefined);
		return change;
	}

	private readReadyLink(): ReadyLink {
		if (this.connection === undefined) {
			throw new VoltNotConnectedError();
		}
		if (this.status.kind !== 'ready') {
			throw new VoltStateUnknownError();
		}
		return { connection: this.connection, state: this.status.state };
	}

	private async connect(): Promise<void> {
		try {
			const connection = await this.options.openConnection();
			this.connection = connection;
			this.publish({ kind: 'waitingForState' });
			await this.followReports(connection);
		} catch (error) {
			this.options.onError(error);
		}
		this.connection?.close();
		this.connection = undefined;
		this.publish({ kind: 'disconnected' });
		this.options.schedule(() => {
			void this.connect();
		}, this.options.reconnectDelayMilliseconds);
	}

	/** Reads reports until the Volt 1 is gone, which rejects. */
	private async followReports(connection: VoltConnection): Promise<void> {
		for (;;) {
			const state = parseVoltStateReport(await connection.readReport());
			if (state !== undefined) {
				this.publish({ kind: 'ready', state });
			}
		}
	}

	private publish(status: VoltStatus): void {
		if (isSameVoltStatus(this.status, status)) {
			return;
		}
		this.status = status;
		for (const listener of this.listeners) {
			listener(status);
		}
	}
}
