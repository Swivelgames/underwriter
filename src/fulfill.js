import { ERRORS } from "./copy.js";
import { formatName } from "./utils.js";

/**
 * defaultInitializer: Default function executed when a guarantee is fulfilled.
 *
 * @type {Function}
 */
export const defaultInitializer = (_, guarantee) => guarantee;

/**
 * Fulfill a Guarantee
 *
 * @method fulfill
 * @param  {String} identifier Identifier for Guarantee
 * @param  {any}    guarantee  The content that was guaranteed
 * @return {!Promise} Promise, fulfilled with the Guarantee
 */
const fulfill = (instance, priv, identifier, guarantee) => {
	// No checks for instance, private, and identifier
	// Why? This function is internal-only. We expect these
	// to always be valid. If they're not, that's the caller's problem

	// Grab our private instance properties
	const {
		defer,
		registry,
		resolvers,
		initializer = defaultInitializer,
	} = priv;

	// Normalize the identifier
	const fmtdId = formatName(identifier);

	// Make sure no one has already fulfilled this Guarantee
	if (registry.has(fmtdId)) {
		return Promise.reject(
			new RangeError(
				ERRORS.Fulfill.guaranteeAlreadyRegistered(identifier)
			)
		);
	}
	// Let everyone know that we're fulfilling this Guarantee
	registry.add(fmtdId);

	// Grab the promise for this Guarantee
	const promise = instance.get(identifier, true);

	// Wait until the defer is fulfilled before proceeding
	defer.then(() => (
		// Pass the guarantee to our initialzer
		initializer(identifier, guarantee)
	)).then(
		// Finally, we're officially fulfilled
		(initialized) => resolvers.get(fmtdId).resolve(initialized),
		// Or not... reject with an error!
		(error) => resolvers.get(fmtdId).reject(error)
	);

	return promise;
};

export default fulfill;
