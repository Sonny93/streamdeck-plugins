/**
 * How a "Screen Power" key turns a monitor off:
 * a black screen over it, which keeps the Windows layout, or the standby of the monitor over DDC/CI, which some monitors
 * leave by unplugging and plugging back, so Windows moves the windows around.
 */
export type ScreenOffMode = 'blackScreen' | 'standby';
