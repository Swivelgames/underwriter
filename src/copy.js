/* eslint-disable import/prefer-default-export */

/* /c8 ignore start */
const ERROR_NOT_MY_FAULT = "This most likely isn't an issue with Berth, but with the library or framework you're using. Please submit an issue ticket to the owners of this package.";

const ERRORS = {
	Guarantor: {
		constructor: {
			invalidRetriever: (qualifier, retriever) => (
				`FATAL: new Guarantor( { qualifier: "${qualifier}", retriever: "${void 0}", ... } ): Invalid retriever. A retriever must be a function that accepts a string ID and returns the requested resource. ${ERROR_NOT_MY_FAULT}`
			),
			qualifierTaken: (qualifier, defaultQual) => (
				`FATAL: new Guarantor( { qualifier: "${qualifier}", addressable: true, ... } ): There is already an instance of Guarantor with the specified qualifier. Please choose a unique qualifier for your Guarantor or, if you want to isolate this Guarantor, you can set "addressable" to false. However, this will prevent outside Guarantees from being able to address this Guarantor for dependencies. ${ERROR_NOT_MY_FAULT}`
			),
		},
		getAll: {
			guarantorDoesntExist: (identifier, qualifier, qualifiers) => (
				`Guarantor::getAll( dependencies ): An error occurred when trying to retrieve a dependency: There is no guarantor with qualifier '${qualifier}' for '${identifier}'. Current list of qualifiers include: ${qualifiers.join(', ')}. ${ERROR_NOT_MY_FAULT}`
			),
		},
		get: {
			requiredIdentifier: (identifier, qualifier, meta) => (
				`Guarantor[${qualifier}].get( identifier ): Missing required parameter: identifier. ${ERROR_NOT_MY_FAULT}`
			),
			retrieveError: (identifier, qualifier, meta) => (
				`Guarantor[${qualifier}].retriever( identifier: "${identifier}" ): An error occurred when trying to retrieve the referenced identifier. ${ERROR_NOT_MY_FAULT}`
			),
		},
		fulfill: {
			requiredIdentifier: (identifier, qualifier, meta) => (
				`Guarantor[${qualifier}].fulfill( identifier, guarantee, dependencies ): Missing required parameter: identifier. ${ERROR_NOT_MY_FAULT}`
			),
			guaranteeAlreadyRegistered: (identifier, qualifier) => (
				`Guarantor[${qualifier}].register( identifier: "${identifier}", guarantee: ${typeof guarantee}, dependencies: ${typeof dependencies} ): This guarantee has already been fulfilled. Guarantees should only be fulfilled once. ${ERROR_NOT_MY_FAULT}`
			)
		},
	},
};

export { ERRORS };
/* /c8 ignore stop */

