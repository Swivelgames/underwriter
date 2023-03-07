declare module "underwriter" {
	export type Retriever<I> = (identifier: string) => Promise<I>;

	export type Initializer<T,I> = (identifier: string, module: I) => T;

	export interface GuarantorOptions<T,I> {
		defer?: Promise<void>,
		retriever: Retriever<I>,
		initializer?: Initializer<T,I>,
		retrieveEarly?: boolean,
		thenableApi?: typeof Promise,
		publicFulfill?: boolean,
	}

	export default class Guarantor<T,I> {
		constructor(options: GuarantorOptions<T,I>);
		get(identifier: string): Promise<I>;
		fulfill(identifier: string, guarantee: I): Promise<T>;
	}
}
