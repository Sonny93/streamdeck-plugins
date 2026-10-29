import { keyLabelSettingsSchema } from 'deck-kit/keys/key_label_settings_schema';
import { z } from 'zod';

/** Per-action settings of the audio device actions: the picked device and, on keys, the drawn label; unknown keys are ignored. */
export const audioDeviceSettingsSchema = keyLabelSettingsSchema.extend({
	device: z.string().optional(),
});
