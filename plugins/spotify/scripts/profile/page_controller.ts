import type { PageAction } from './page_action.ts';

/** The actions of one controller type on a page, keyed by "column,row", or null when the controller has none. */
export type PageController = Readonly<{
	Actions: Readonly<Record<string, PageAction>> | null;
	Type: string;
}>;
