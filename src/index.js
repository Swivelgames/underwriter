import { ERRORS } from "../copy.js";
import { formatName, initializeIfNeeded } from "../utils.js";

/**
 * Private: WeakMap for storing instance properties that shouldn't
 * be accessed publicly. Automatically garbage collected when instance
 * is deconstructed and references are purged.
 *
 * @type {WeakMap}
 */
const Private = new WeakMap();

/**
 * Guarantors: Map for storing instances each Garante instance
 * using its Qualifier as the key.
 *
 * @type {WeakMap}
 */
const Guarantors = new Map();

/**
 * DEFAULT_GUARANTOR: String representing the default qualifier
 * for a new Garante.
 *
 * @
 */
const DEFAULT_GUARANTOR = "$default";

const defaultInitializer = ({
	guarantee,
	dependencies,
}) => ({
	guarantee,
	dependencies,
});

/**
 * Guarantor
 */
export default class Garante {

	/**
	 * Retrieves a number of Guarantees across all available Guarantors
	 *
	 * @static getAll
	 * @param  {[string, string][]} identifiers Array of identifiers and their qualifiers
	 * @return {!Promise} Promise, fulfilled with all guarantees
	 */
	static getAll(identifiers, currentGuarantor) {
		// Grab a list of qualifiers
		const qualifiers = Guarantors.keys();

		return Promise.all(
			// Iterator over the identifiers, expecting:
			// [
			//     ['id1', 'qualifier1'],
			//     ['id2', 'qualifier1']
			// ]
			identifiers.map(([identifier, qualifier]) => {
				// If there's no qualifier, use the currentGuarantor
				if (!qualifier) {
					// If they didn't give us one, throw an error
					if (currentGuarantor) {
						throw new RangeError(
							ERRORS.Garante.getAll.missingGuarantor
						);
					}
					// Get the guarantee from the currentGuarantor
					return currentGuarantor.get(identifier).then(
						(guarantee) => ({
							qualifier,
							identifier,
							guarantee
						})
					);
				}

				// Normalize the specified qualifier
				const fmtdQualifier = formatName(qualifier);

				// Check to see if we have a qualifier by this name
				if (!qualifiers.includes(fmtdQualifier)) {
					// If not, we won't be able to get the guarantee
					return Promise.reject(
						new TypeError(
							ERRORS.Garante.getAll.guarantorDoesntExist(
								identifier, qualifier, qualifiers
							)
						)
					);
				}

				// Grab the Guarantor and request the Guarantee
				const garante = Guarantors[qualifier];
				return garante.get(identifier).then(
					(guarantee) => ({
						qualifier,
						identifier,
						guarantee
					})
				);
			})
		);
	}

	constructor({
		qualifier: specifiedQualifier,
		parent = Promise.resolve(),
		retriever,
		initializer = ({ guarantee, dependencies }) => i,
		addressable = !!specifiedQualifier,
	}, meta) {
		const qualifier = specifiedQualifier || DEFAULT_GUARANTOR;

		Private.set(this, {
			meta,
			qualifier,
			parent,
			retriever,
			registry: new Set(),
			resolvers: new Map(),
			promises: new Map()
		});

		if (addressable === true) {
			const fmtdQualifier = formatName(qualifier);
			if (Guarantors.has(fmtdQualifier)) {
				throw new RangeError(
					ERRORS.Garante.constructor.qualifierTaken(
						specifiedQualifier, DEFAULT_GUARANTOR
					)
				);
			}
			Guarantors.set(fmtdQualifier, this);
		}
	}

	/**
	 * Promises to retrieve the Qualified Guarantee
	 *
	 * @method get
	 * @param  {String} identifier Identifier of the Guarantee
	 * @return {!Promise} Promise, fulfilled when the Guarantee is fulfilled
	 */
	get(identifier) {
		// Grab all our private instance properties
		const {
			meta,
			qualifier,
			resolvers,
			promises,
			parent
		} = Private.get(this);

		// Make sure our identifier is a valid string
		if (typeof identifier !== "string" || identifier.length === 0) {
			return Promise.reject(
				new TypeError(
					ERRORS.Guarantor.get.requiredIdentifier(identifier, qualifier, meta)
				)
			);
		}

		// Normalize the identifier
		const fmtdId = formatName(identifier);

		// Is there already a Promise for the Guarantee we're requesting?
		// If so, return it.
		// Otherwise, create it.
		return initializeIfNeeded(promises, fmtdId, () => (
			new Promise((resolve, reject) => {
				// Save the resolve and reject methods
				// so that we can invoke them later
				resolvers.set(fmtdId, { resolve, reject });

				// Retrieve the subject of the guarantee
				Promise.resolve(
					retriever(identifier, qualifier, meta)
				).catch(reject);
			})
		).catch((error) => {
			// If there was an error retrieving, display it and then rethrow
			console.error(
				ERRORS.Guarantor.get.retrieverError(identifier, qualifier, meta)
			);
			throw error;
		}));
	}

	/**
	 * Fulfill a Guarantee
	 *
	 * @method fulfill
	 * @param  {String} identifier Identifier for Guarantee
	 * @param  {TypeMember} guarantee The content that was guaranteed
	 * @return {!Promise} Promise, fulfilled with the Guarantee
	 */
	fulfill(identifier, guarantee, dependencies = []) {
		const {
			meta,
			qualifier,
			parent,
			registry,
			resolvers
		} = Private.get(this);

		// Normalize the identifier
		const fmtdId = formatName(identifier);

		// Make sure no one has already fulfilled this Guarantee
		if (registry.has(fmtdId)) {
			return Promise.reject(
				new RangeError(
					ERRORS.Guarantor.register.guaranteeAlreadyRegistered(
						identifier, qualifier, meta
					)
				)
			);
		}
		// Let everyone know that we're fulfilling this Guarantee
		registry.add(fmtdId);

		// Grab the promise for this Guarantee
		const promise = this.get(identifier);

		// Wait until the parent fulfilled and all of our dependencies are done
		// being fulfilled themselves before proceeding
		parent.then(
			dependencies.length ? (
				Garante.getAll(dependencies)
			) : (
				Promise.resolve()
			)
		).then((deps) => (
			// Finally, pass the guarantee to our initialzer
			initializer({
				identifier,
				qualifier,
				guarantee,
				dependencies: deps,
			})
		)).then(
			// Finally, we're officially fulfilled
			(initialized) => resolvers.get(fmtdId).resolve(initialized),
			// Or not... reject with an error!
			(error) => resolvers.get(fmtdId).reject(error)
		);

		return promise;
	}
}
