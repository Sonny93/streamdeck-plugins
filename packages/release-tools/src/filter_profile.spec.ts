import { describe, expect, it } from 'vitest';

import { buildTestAction } from './build_test_action.ts';
import { buildTestDocument } from './build_test_document.ts';
import { buildTestOpenFolderAction } from './build_test_open_folder_action.ts';
import { buildTestPage } from './build_test_page.ts';
import { filterProfile } from './filter_profile.ts';
import { listPageActions } from './list_page_actions.ts';
import { NO_CURRENT_PAGE, ProfileActionUuids } from './profile_action_uuids.ts';
import { UnsupportedProfileActionError } from './unsupported_profile_action_error.ts';

const AUDIO = 'com.sonny93.audio';
const BEAMNG = 'com.sonny93.beamng';
const ALLOWED_PLUGINS: ReadonlySet<string> = new Set([AUDIO]);

const backAction = buildTestAction({
	pluginUuid: ProfileActionUuids.backToParent,
	uuid: ProfileActionUuids.backToParent,
});
const switchAction = buildTestAction({
	pluginUuid: ProfileActionUuids.rotate,
	uuid: ProfileActionUuids.rotate,
});

function countActions(
	document: ReturnType<typeof filterProfile>,
	pageId: string
): number {
	const manifest = document.pages.get(pageId);
	return manifest === undefined ? -1 : listPageActions({ manifest }).length;
}

describe('filterProfile', () => {
	it('should remove the actions of a plugin that is not allowed and turn an emptied controller into null', () => {
		const document = buildTestDocument({
			defaultPage: 'main',
			pages: {
				main: buildTestPage({
					keys: { '0,0': buildTestAction({ pluginUuid: AUDIO }) },
					dials: { '0,0': buildTestAction({ pluginUuid: BEAMNG }) },
				}),
			},
		});

		const filtered = filterProfile({
			document,
			allowedPlugins: ALLOWED_PLUGINS,
		});

		expect(filtered.pages.get('main')?.['Controllers']).toEqual([
			{
				Actions: { '0,0': buildTestAction({ pluginUuid: AUDIO }) },
				Type: 'Keypad',
			},
			{ Actions: null, Type: 'Encoder' },
		]);
	});

	it('should keep Stream Deck actions whatever the allowed plugins', () => {
		const document = buildTestDocument({
			defaultPage: 'main',
			pages: { main: buildTestPage({ keys: { '0,0': switchAction } }) },
		});

		const filtered = filterProfile({
			document,
			allowedPlugins: new Set(),
		});

		expect(filtered).toEqual(document);
	});

	it('should remove a folder left with only a Back key, with the key that opens it', () => {
		const document = buildTestDocument({
			defaultPage: 'main',
			pages: {
				main: buildTestPage({
					keys: {
						'0,0': buildTestAction({ pluginUuid: AUDIO }),
						'1,0': buildTestOpenFolderAction({ folderId: 'folder' }),
					},
				}),
				folder: buildTestPage({
					keys: {
						'0,0': backAction,
						'1,0': buildTestAction({ pluginUuid: BEAMNG }),
					},
				}),
			},
		});

		const filtered = filterProfile({
			document,
			allowedPlugins: ALLOWED_PLUGINS,
		});

		expect([...filtered.pages.keys()]).toEqual(['main']);
		expect(countActions(filtered, 'main')).toBe(1);
	});

	it('should remove nested folders and the parent they empty', () => {
		const document = buildTestDocument({
			defaultPage: 'main',
			pages: {
				main: buildTestPage({
					keys: {
						'0,0': buildTestAction({ pluginUuid: AUDIO }),
						'1,0': buildTestOpenFolderAction({ folderId: 'parent' }),
					},
				}),
				parent: buildTestPage({
					keys: {
						'0,0': backAction,
						'1,0': buildTestOpenFolderAction({ folderId: 'child' }),
					},
				}),
				child: buildTestPage({
					keys: {
						'0,0': backAction,
						'1,0': buildTestAction({ pluginUuid: BEAMNG }),
					},
				}),
			},
		});

		const filtered = filterProfile({
			document,
			allowedPlugins: ALLOWED_PLUGINS,
		});

		expect([...filtered.pages.keys()]).toEqual(['main']);
		expect(countActions(filtered, 'main')).toBe(1);
	});

	it('should keep a folder that still holds an action, and match folder identifiers whatever their case', () => {
		const document = buildTestDocument({
			defaultPage: 'main',
			pages: {
				MAIN: buildTestPage({
					keys: { '0,0': buildTestOpenFolderAction({ folderId: 'FOLDER' }) },
				}),
				folder: buildTestPage({
					keys: {
						'0,0': backAction,
						'1,0': buildTestAction({ pluginUuid: AUDIO }),
					},
				}),
			},
		});

		const filtered = filterProfile({
			document,
			allowedPlugins: ALLOWED_PLUGINS,
		});

		expect(filtered).toEqual(document);
	});

	it('should never remove the default page', () => {
		const document = buildTestDocument({
			defaultPage: 'main',
			pages: {
				main: buildTestPage({
					keys: { '0,0': buildTestAction({ pluginUuid: BEAMNG }) },
				}),
			},
		});

		const filtered = filterProfile({
			document,
			allowedPlugins: ALLOWED_PLUGINS,
		});

		expect(countActions(filtered, 'main')).toBe(0);
	});

	it('should remove a listed page left with only navigation keys and reset the current page that pointed to it', () => {
		const document = buildTestDocument({
			defaultPage: 'main',
			listedPages: ['music', 'beamng'],
			currentPage: 'beamng',
			pages: {
				main: buildTestPage({}),
				music: buildTestPage({
					keys: { '0,0': buildTestAction({ pluginUuid: AUDIO }) },
				}),
				beamng: buildTestPage({
					keys: {
						'0,0': buildTestAction({ pluginUuid: BEAMNG }),
						'1,0': switchAction,
					},
				}),
			},
		});

		const filtered = filterProfile({
			document,
			allowedPlugins: ALLOWED_PLUGINS,
		});

		expect([...filtered.pages.keys()]).toEqual(['main', 'music']);
		expect(filtered.rootManifest['Pages']).toEqual({
			Current: NO_CURRENT_PAGE,
			Default: 'main',
			Pages: ['music'],
		});
	});

	it('should keep the listed pages as blank pages when removing them would leave none', () => {
		const document = buildTestDocument({
			defaultPage: 'main',
			listedPages: ['beamng'],
			pages: {
				main: buildTestPage({
					keys: { '0,0': buildTestAction({ pluginUuid: AUDIO }) },
				}),
				beamng: buildTestPage({
					keys: {
						'0,0': buildTestAction({ pluginUuid: BEAMNG }),
						'1,0': switchAction,
					},
				}),
			},
		});

		const filtered = filterProfile({
			document,
			allowedPlugins: ALLOWED_PLUGINS,
		});

		expect([...filtered.pages.keys()]).toEqual(['main', 'beamng']);
		expect(countActions(filtered, 'beamng')).toBe(1);
	});

	it('should throw when a page holds a multi action', () => {
		const document = buildTestDocument({
			defaultPage: 'main',
			pages: {
				main: buildTestPage({
					keys: {
						'0,0': buildTestAction({
							pluginUuid: `${ProfileActionUuids.multiActionsPrefix}.routine`,
						}),
					},
				}),
			},
		});

		expect(() =>
			filterProfile({ document, allowedPlugins: ALLOWED_PLUGINS })
		).toThrow(UnsupportedProfileActionError);
	});
});
