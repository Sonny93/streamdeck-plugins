import { minimalstuffPreset } from '@minimalstuff/tooling/oxc/fmt';

export default minimalstuffPreset({
	ignorePatterns: ['**/*.sdPlugin/bin/**', 'pnpm-lock.yaml'],
});
