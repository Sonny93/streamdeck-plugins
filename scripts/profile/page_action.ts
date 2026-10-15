/** An action as it is stored in a page manifest, with one empty object per state of the action. */
export type PageAction = Readonly<{
	ActionID: string;
	LinkedTitle: boolean;
	Name: string;
	Plugin: Readonly<{ Name: string; UUID: string; Version: string }>;
	Resources: null;
	Settings: Readonly<Record<string, string>>;
	State: number;
	States: readonly Readonly<Record<string, never>>[];
	UUID: string;
}>;
