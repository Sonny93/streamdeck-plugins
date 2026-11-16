/** Any JSON value. */
export type JsonValue =
	| string
	| number
	| boolean
	| null
	| JsonValue[]
	| { [key: string]: JsonValue };

/** A JSON object, the shape of the global settings of a plugin. */
export type JsonObject = { [key: string]: JsonValue };
