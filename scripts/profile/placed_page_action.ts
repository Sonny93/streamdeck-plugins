import type { PageAction } from './page_action.ts';

/** A page action that is not declared by the plugin (a folder key, for instance), already built, with where it sits. */
export type PlacedPageAction = Readonly<{
	column: number;
	row: number;
	action: PageAction;
}>;
