import type { z } from 'zod';

import type { playOnDeviceSettingsSchema } from './play_on_device_settings_schema';

/** Settings persisted by a "Play on device" key, edited in its property inspector. */
export type PlayOnDeviceSettings = z.output<typeof playOnDeviceSettingsSchema>;
