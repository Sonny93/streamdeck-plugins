import type { z } from 'zod';

import type { audioDeviceSettingsSchema } from './audio_device_settings_schema';

/** Settings persisted by an audio device action, edited in its property inspector. */
export type AudioDeviceSettings = z.output<typeof audioDeviceSettingsSchema>;
