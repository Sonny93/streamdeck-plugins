import type { AudioFlow } from '../../audio/audio_flow';

/** Which devices the property inspector of an action offers, and the data source event it asks them with. */
export type AudioDeviceChoices = Readonly<{
	event: string;
	flows: readonly AudioFlow[];
	/** Whether "Default output" and "Default input" are offered, following Windows. */
	offersDefaults: boolean;
}>;
