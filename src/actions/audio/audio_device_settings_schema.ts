import { z } from 'zod';

/**
 * Per-action settings of the audio device actions, written by the property inspector; unknown keys are ignored.
 * Only the "Default Output" key offers a label, drawn by the plugin so that it takes the color of the key state.
 */
export const audioDeviceSettingsSchema = z.object({
	device: z.string().optional(),
	label: z.string().optional(),
	labelPosition: z.enum(['top', 'bottom']).optional(),
});
