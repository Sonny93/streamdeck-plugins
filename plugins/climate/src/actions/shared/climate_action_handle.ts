import type { WillAppearEvent } from '@elgato/streamdeck';

import type { ClimateActionSettings } from './climate_action_settings';

/** The key or dial an event of the plugin came from. */
export type ClimateActionHandle =
	WillAppearEvent<ClimateActionSettings>['action'];
