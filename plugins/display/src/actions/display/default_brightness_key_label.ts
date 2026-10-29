import type { DisplayActionConfig } from './display_action_config';

/** Label of a "Brightness" key while none is typed: the value it sets, or the step it moves by. */
export function defaultBrightnessKeyLabel(config: DisplayActionConfig): string {
	switch (config.brightnessKeyMode) {
		case 'set':
			return `${String(config.value)} %`;
		case 'up':
			return `+${String(config.step)} %`;
		case 'down':
			return `−${String(config.step)} %`;
	}
}
