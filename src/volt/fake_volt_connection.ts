import { VoltReadError } from './volt_read_error';
import type { VoltConnection } from './volt_connection';

type PendingRead = Readonly<{
	resolve: (report: Uint8Array) => void;
	reject: (error: unknown) => void;
}>;

/** Test double of a Volt 1 link: tests push its reports by hand, and its writes are recorded. */
export class FakeVoltConnection implements VoltConnection {
	readonly writtenReports: Uint8Array[] = [];
	isClosed = false;
	private pendingRead: PendingRead | undefined;

	readonly readReport = (): Promise<Uint8Array> =>
		new Promise((resolve, reject) => {
			this.pendingRead = { resolve, reject };
		});

	readonly writeReport = (report: Uint8Array): Promise<void> => {
		this.writtenReports.push(report);
		return Promise.resolve();
	};

	readonly close = (): void => {
		this.isClosed = true;
	};

	/** Answers the pending read with a report, as the Volt 1 does when something happens on it. */
	pushReport(report: Uint8Array): void {
		const read = this.pendingRead;
		this.pendingRead = undefined;
		read?.resolve(report);
	}

	/** Fails the pending read, as Windows does when the Volt 1 is unplugged. */
	unplug(): void {
		const read = this.pendingRead;
		this.pendingRead = undefined;
		read?.reject(new VoltReadError());
	}
}
