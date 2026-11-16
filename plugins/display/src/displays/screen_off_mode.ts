/**
 * How a "Screen Power" key turns a monitor off:
 * a black screen over it, which keeps the window layout, or the standby of the monitor over DDC/CI, which some monitors
 * leave by unplugging and plugging back, so the system moves the windows around.
 */
export type ScreenOffMode = 'blackScreen' | 'standby';
