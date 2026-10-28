import type koffiModule from 'koffi';

type ComPrototype = ReturnType<(typeof koffiModule)['proto']>;

/** koffi prototypes of the Core Audio COM methods the bindings call. */
export type CoreAudioPrototypes = Readonly<{
	enumAudioEndpoints: ComPrototype;
	getDefaultAudioEndpoint: ComPrototype;
	getDevice: ComPrototype;
	getCount: ComPrototype;
	item: ComPrototype;
	activate: ComPrototype;
	openPropertyStore: ComPrototype;
	getId: ComPrototype;
	getValue: ComPrototype;
	setMasterVolumeLevelScalar: ComPrototype;
	getMasterVolumeLevelScalar: ComPrototype;
	setMute: ComPrototype;
	getMute: ComPrototype;
	setDefaultEndpoint: ComPrototype;
}>;
