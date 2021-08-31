/* eslint-disable import/prefer-default-export */

/* /c8 ignore start */
const ERROR_NOT_MY_FAULT = "This most likely isn't an issue with Berth, but with the library or framework you're using. Please submit an issue ticket to the owners of this package.";

const ERRORS = {
	Guarantor: {
		constructor: {
			invalidRetriever: (retriever) => (
				`FATAL: new Guarantor( { retriever: ~${typeof retriever}, ... } ): Invalid retriever. A retriever must be a function that accepts a string ID and returns the requested resource. ${ERROR_NOT_MY_FAULT}`
			),
			invalidInitializer: (initializer) => (
				`FATAL: new Guarantor( { initializer: ~${typeof initializer}, ... } ): Invalid initializer. An initializer must be a function that accepts a string ID and its associated guarantee, and returns the final value of the guarantee. ${ERROR_NOT_MY_FAULT}`
			),
		},
		get: {
			requiredIdentifier: () => (
				`Guarantor.get( identifier ): Missing required parameter: identifier. ${ERROR_NOT_MY_FAULT}`
			),
			retrieverError: (identifier) => (
				`Guarantor.retriever( identifier: "${identifier}" ): An error occurred when trying to retrieve the referenced identifier. ${ERROR_NOT_MY_FAULT}`
			),
		},
	},
	Fulfill: {
		guaranteeAlreadyRegistered: (identifier) => (
			`Guarantor.fulfill( identifier: "${identifier}", guarantee ): This guarantee has already been fulfilled. Guarantees should only be fulfilled once. ${ERROR_NOT_MY_FAULT}`
		)
	},
};

export { ERRORS };
/* /c8 ignore stop */
