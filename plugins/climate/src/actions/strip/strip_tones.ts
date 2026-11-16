import type { StripTone } from './strip_tone';

/** The two stops of the background gradient of each tone, kept dark so light text stays readable over the whole strip. */
export const StripTones: Readonly<
	Record<StripTone, Readonly<{ from: string; to: string }>>
> = {
	heat: { from: '#7C2D12', to: '#450A0A' },
	cool: { from: '#1E40AF', to: '#172554' },
	teal: { from: '#115E59', to: '#134E4A' },
	neutral: { from: '#2B2B2B', to: '#151515' },
};
