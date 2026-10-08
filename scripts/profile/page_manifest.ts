import type { PageController } from './page_controller.ts';

/** The `manifest.json` of a profile page: the keypad and encoder controllers. */
export type PageManifest = Readonly<{
	Controllers: readonly PageController[];
	Icon: string;
	Name: string;
}>;
