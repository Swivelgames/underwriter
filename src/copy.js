/* eslint-disable import/prefer-default-export */

/* /c8 ignore start */
const ERROR_NOT_MY_FAULT = "This most likely isn't an issue with Garante, but with the library or framework you're using. Please submit an issue ticket to the owners of this package.";

const ERRORS = {
	Garante: {
		constructor: {
			qualifierTaken: (qualifier, defaultQual) => (
				`FATAL: new Garante( { qualifier: "${qualifier}", addressable: true, ... } ): There is already an instance of Garante with the specified qualifier. Please choose a unique qualifier for your Garante or, if you want to isolate this Garante, you can set "addressable" to false. However, this will prevent outside Guarantees from being able to address this Garante for dependencies. ${ERROR_NOT_MY_FAULT}`
			),
		},
		getAll: {
			guarantorDoesntExist: (identifier, qualifier, qualifiers) => (
				`Garante::getAll( dependencies ): An error occurred when trying to retrieve a dependency: There is no guarantor with qualifier '${qualifier}' for '${identifier}'. Current list of qualifiers include: ${qualifiers.join(', ')}. ${ERROR_NOT_MY_FAULT}`
			),
		},
		get: {
			requiredIdentifier: (identifier, qualifier, meta) => (
				`Garante[${qualifier}].get( identifier ): Missing required parameter: identifier. ${ERROR_NOT_MY_FAULT}`
			),
			retrieveError: (identifier, qualifier, meta) => (
				`Garante[${qualifier}].retriever( identifier: "${identifier}" ): An error occurred when trying to retrieve the referenced identifier. ${ERROR_NOT_MY_FAULT}`
			),
		},
		register: {
			guaranteeAlreadyRegistered: (identifier, qualifier) => (
				`Garante[${qualifier}].register( identifier: "${identifier}", guarantee: ${typeof guarantee}, dependencies: ${typeof dependencies} ): This guarantee has already been fulfilled. Guarantees should only be fulfilled once. ${ERROR_NOT_MY_FAULT}`
			)
		},
	},
};

export { ERRORS };
/* /c8 ignore stop */

