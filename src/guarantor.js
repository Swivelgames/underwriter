import fulfill from "./fulfill.js";

import { ERRORS } from "./copy.js";
import { formatName, initializeIfNeeded } from "./utils.js";

/**
 * Private: WeakMap for storing instance properties that shouldn't
 * be accessed publicly. Automatically garbage collected when instance
 * is deconstructed and references are purged.
 *
 * @type {WeakMap}
 */
const Private = new WeakMap();

/**
 * Guarantor
 */
export default class Guarantor {
	constructor({
		defer = Promise.resolve(),
		retriever,
		initializer,
		retrieveEarly = false,
		thenableApi = Promise,
		publicFulfill = false,
	}) {
		// Make sure our retriever is a function
		if (publicFulfill !== true && (!retriever || typeof retriever !== "function")) {
			throw new TypeError(
				ERRORS.Guarantor.constructor.invalidRetriever(
					retriever
				)
			);
		}

		// Make sure our defer is a thenable
		if (defer && typeof defer.then !== "function") {
			throw new TypeError(
				ERRORS.Guarantor.constructor.invalidDeferrer(
					defer
				)
			);
		}

		// Make sure our retriever is a function
		if (initializer && typeof initializer !== "function") {
			throw new TypeError(
				ERRORS.Guarantor.constructor.invalidInitializer(
					initializer
				)
			);
		}

		// Make sure that our thenableApi provides a .then() method
		if (thenableApi !== Promise && typeof thenableApi?.prototype?.then !== "function") {
			throw new TypeError(
				ERRORS.Guarantor.constructor.invalidThenableApi(
					thenableApi
				)
			);
		}

		/* c8 ignore start */
		Private.set(this, {
			defer,
			retriever,
			retrieveEarly,
			thenableApi,
			publicFulfill,
			...(initializer ? ({ initializer }) : {}),
			registry: new Set(),
			resolvers: new Map(),
			promises: new Map()
		});
		/* c8 ignore stop */

		if (publicFulfill === true) {
			Object.defineProperty(this, "fulfill", {
				configurable: true,
				writable: false,
				value: (identifier, guarantee) => (
					fulfill(
						this,
						Private.get(this),
						identifier,
						guarantee
					)
				)
			});
		}
	}

	/**
	 * Promises to retrieve the Guarantee
	 *
	 * @method get
	 * @param  {String} identifier Identifier of the Guarantee
	 * @return {!Promise} Promise, fulfilled when the Guarantee is fulfilled
	 */
	get(identifier) {
		// Sneakily grab a hidden, internal parameter
		/* eslint-disable prefer-rest-params */
		const [, lazy = false] = Array.from(arguments);
		/* eslint-enable prefer-rest-params */

		// Grab all our private instance properties
		const {
			defer,
			resolvers,
			promises,
			retriever,
			retrieveEarly,
			publicFulfill,
			thenableApi: ThenableApi
		} = Private.get(this);

		// Make sure our identifier is a valid string
		if (typeof identifier !== "string" || identifier.length === 0) {
			return Promise.reject(
				new TypeError(
					ERRORS.Guarantor.get.requiredIdentifier(
						identifier
					)
				)
			);
		}

		// Normalize the identifier
		const fmtdId = formatName(identifier);

		// Is there already a Promise for the Guarantee we're requesting?
		// If so, return it.
		// Otherwise, create and then return it.
		return initializeIfNeeded(promises, fmtdId, () => (
			new ThenableApi((resolve, reject) => {
				// Save the resolve and reject methods
				// so that we can invoke them later
				resolvers.set(fmtdId, { resolve, reject });

				// If we're being lazy, don't call the retriever
				if (lazy === true || !retriever) return;

				const principle = retrieveEarly ? Promise.resolve() : defer;

				// Retrieve the subject of the guarantee
				principle.then(
					() => retriever(identifier)
				).then((guarantee) => {
					if (typeof guarantee === "undefined") {
						if (publicFulfill === true) return;
						console.warn(
							ERRORS.Guarantor.get.undefinedGuarantee(
								identifier, guarantee
							)
						);
					}
					return fulfill(this, Private.get(this), identifier, guarantee)
				}).catch(reject);
			})
		).catch((error) => {
			// If there was an error retrieving, display it and then rethrow
			console.error(
				ERRORS.Guarantor.get.retrieverError(identifier)
			);
			console.error(error);
			throw error;
		}));
	}
}
