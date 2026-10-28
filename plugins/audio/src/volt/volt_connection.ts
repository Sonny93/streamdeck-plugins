/** An open link to the vendor HID collection of the Volt 1. */
export type VoltConnection = Readonly<{
	/** Waits for the next input report; rejects once the Volt 1 is gone. */
	readReport: () => Promise<Uint8Array>;
	writeReport: (report: Uint8Array) => Promise<void>;
	close: () => void;
}>;
