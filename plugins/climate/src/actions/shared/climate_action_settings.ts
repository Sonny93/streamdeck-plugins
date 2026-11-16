/**
 * Settings persisted by an action of the plugin, as the property inspectors write them: text, or a number from a text field.
 * Each action reads the ones it uses through its own schema, which is what validates them.
 * The address of the unit is not here: it lives in the global settings.
 */
export type ClimateActionSettings = {
	label?: string;
	labelPosition?: 'top' | 'bottom';
	step?: string | number;
	mode?: string;
	temperature?: string | number;
	fanRate?: string | number;
	control?: string;
};
