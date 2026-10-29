/**
 * What a brightness action changes: the monitor over DDC/CI, Windows on the picture,
 * or `auto`, the monitor unless it has no DDC/CI brightness or is known to ignore it.
 */
export type BrightnessControl = 'auto' | 'monitor' | 'windows';
