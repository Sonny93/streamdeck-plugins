/**
 * What a brightness action changes: the monitor over DDC/CI, the system on the picture (stored as `windows`, as it was named when saved),
 * or `auto`, the monitor unless it has no DDC/CI brightness or is known to ignore it.
 */
export type BrightnessControl = 'auto' | 'monitor' | 'windows';
