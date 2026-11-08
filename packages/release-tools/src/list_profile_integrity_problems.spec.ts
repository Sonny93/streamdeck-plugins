import { describe, expect, it } from 'vitest';

import { buildTestAction } from './build_test_action.ts';
import { buildTestDocument } from './build_test_document.ts';
import { buildTestOpenFolderAction } from './build_test_open_folder_action.ts';
import { buildTestPage } from './build_test_page.ts';
import { listProfileIntegrityProblems } from './list_profile_integrity_problems.ts';
import { ProfileActionUuids } from './profile_action_uuids.ts';

const AUDIO = 'com.sonny93.audio';
const ALLOWED_PLUGINS: ReadonlySet<string> = new Set([AUDIO]);

describe('listProfileIntegrityProblems', () => {
	it('should report nothing for a sound profile, whatever the case of the identifiers', () => {
		const document = buildTestDocument({
			defaultPage: 'MAIN',
			listedPages: ['Other'],
			pages: {
				main: buildTestPage({
					keys: { '0,0': buildTestOpenFolderAction({ folderId: 'FOLDER' }) },
				}),
				other: buildTestPage({
					keys: { '0,0': buildTestAction({ pluginUuid: AUDIO }) },
				}),
				folder: buildTestPage({}),
			},
		});

		expect(
			listProfileIntegrityProblems({
				document,
				allowedPlugins: ALLOWED_PLUGINS,
			})
		).toEqual([]);
	});

	it('should report a missing default page, a missing listed page and a missing folder', () => {
		const document = buildTestDocument({
			defaultPage: 'main',
			listedPages: ['gone'],
			pages: {
				other: buildTestPage({
					keys: { '0,0': buildTestOpenFolderAction({ folderId: 'lost' }) },
				}),
			},
		});

		const problems = listProfileIntegrityProblems({
			document,
			allowedPlugins: ALLOWED_PLUGINS,
		});

		expect(problems).toEqual(
			expect.arrayContaining([
				'the default or listed page main does not exist',
				'the default or listed page gone does not exist',
			])
		);
	});

	it('should report a Create Folder key whose folder does not exist', () => {
		const document = buildTestDocument({
			defaultPage: 'main',
			pages: {
				main: buildTestPage({
					keys: { '0,0': buildTestOpenFolderAction({ folderId: 'lost' }) },
				}),
			},
		});

		expect(
			listProfileIntegrityProblems({
				document,
				allowedPlugins: ALLOWED_PLUGINS,
			})
		).toEqual(['a Create Folder key opens lost, which does not exist']);
	});

	it('should report a page that nothing leads to', () => {
		const document = buildTestDocument({
			defaultPage: 'main',
			pages: { main: buildTestPage({}), orphan: buildTestPage({}) },
		});

		expect(
			listProfileIntegrityProblems({
				document,
				allowedPlugins: ALLOWED_PLUGINS,
			})
		).toEqual([
			'page orphan is not the default, not listed and opened by no folder',
		]);
	});

	it('should report an action of a plugin that is not allowed and a multi action', () => {
		const document = buildTestDocument({
			defaultPage: 'main',
			pages: {
				main: buildTestPage({
					keys: {
						'0,0': buildTestAction({ pluginUuid: 'com.sonny93.beamng' }),
						'1,0': buildTestAction({
							pluginUuid: `${ProfileActionUuids.multiActionsPrefix}.routine`,
						}),
					},
				}),
			},
		});

		expect(
			listProfileIntegrityProblems({
				document,
				allowedPlugins: ALLOWED_PLUGINS,
			})
		).toEqual([
			'page main holds an action of com.sonny93.beamng',
			'page main holds the multi action com.elgato.streamdeck.multiactions.routine',
		]);
	});
});
