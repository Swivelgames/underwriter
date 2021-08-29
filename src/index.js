import Guarantor from "./guarantor.js";

import { formatName } from "./utils.js";

const Private = new WeakMap();

export class Berth {
	constructor({
		meta,
		retriever,
	}) {
		Private.set(this, {
			meta,
			retriever,
			registry: new Map(),
		});
	}

	define(qualifier, initializer, customRetriever) {
		if (!qualifier) throw;
		if (!intializer) throw;
		if (registry.has(qualifier)) throw;

		const formattedQualifier = formatName(qualifier);

		let qualifierRetriever;
		if (!customRetriever || typeof customRetriever !== "function") {
			const { retriever } = Private.get(this);
			qualifierRetriever = retriever;
		} else {
			qualifierRetriever = customRetriever;
		}

		const instance = new Guarantor({

		});

		registry.set(formattedQualifier)
	}

	// [
	//     ['qualifier1', 'id1'],
	//     ['qualifier1', 'id2'],
	//     ['qualifier2', 'id3'],
	//     ['qualifier3', 'id4'],
	// ]
	getAll(idPairs) {

	}

	get(qualifier, identifier) {

	}

	fulfill(qualifier, identifier) {

	}
}
