import { describe, expect, it } from 'vitest';

import type { AudioApp } from '../audio/audio_app';
import { listAudioAppChoices } from './list_audio_app_choices';

const DISCORD: AudioApp = {
	imageName: 'Discord.exe',
	displayName: 'Discord',
	volume: 1,
	isMuted: false,
};

describe('listAudioAppChoices', () => {
	it('should list the apps playing sound', () => {
		expect(
			listAudioAppChoices({ apps: [DISCORD], pickedImageName: undefined })
		).toEqual([{ label: 'Discord', value: 'Discord.exe' }]);
	});

	it('should keep the picked app first when it plays nothing', () => {
		expect(
			listAudioAppChoices({ apps: [DISCORD], pickedImageName: 'Game.exe' })
		).toEqual([
			{ label: 'Game', value: 'Game.exe' },
			{ label: 'Discord', value: 'Discord.exe' },
		]);
	});

	it('should not repeat the picked app when it plays sound', () => {
		expect(
			listAudioAppChoices({ apps: [DISCORD], pickedImageName: 'discord.exe' })
		).toHaveLength(1);
	});
});
