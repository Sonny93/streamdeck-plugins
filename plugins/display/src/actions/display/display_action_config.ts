import type { ScreenOffMode } from '../../displays/screen_off_mode';
import type { BrightnessControl } from './brightness_control';
import type { MonitorTarget } from './monitor_target';

/** Settings of a display action with the defaults applied. */
export type DisplayActionConfig = Readonly<{
	target: MonitorTarget;
	brightnessControl: BrightnessControl;
	offMode: ScreenOffMode;
	/** What a "Brightness" key does: set the brightness to `value`, or move it up or down by `step`. */
	brightnessKeyMode: 'set' | 'up' | 'down';
	value: number;
	step: number;
	/** Brightness a pressed "Brightness" dial goes to. */
	preset: number;
}>;
