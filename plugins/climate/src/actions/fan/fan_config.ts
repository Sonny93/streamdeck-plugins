/** What a "Fan" key controls: the fan rate, which a press cycles through, or the swing, which a press switches on and off. */
export type FanConfig = Readonly<{ control: 'rate' | 'swing' }>;
