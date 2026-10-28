import type { VoltButton } from './volt_button';

/** Whether each front panel button of the Volt 1 is on. */
export type VoltState = Readonly<Record<VoltButton, boolean>>;
