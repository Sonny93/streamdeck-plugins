import { minimalstuffPreset } from '@minimalstuff/tooling/oxc/lint';
import { defineConfig } from 'oxlint';

export default defineConfig({
	ignorePatterns: ['**/*.sdPlugin/bin/**'],
	extends: [minimalstuffPreset()],
});
