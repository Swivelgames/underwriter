/* eslint-disable import/prefer-default-export */

/* /c8 ignore start */
const ERROR_NOT_MY_FAULT = "This most likely isn't an issue with Underwriter, but with the library or framework you're using. Please submit an issue ticket to the owners of this package.";

const ERRORS = {
	Guarantor: {
		constructor: {
			invalidRetriever: (retriever) => (
				`FATAL: new Guarantor( { retriever: ~${typeof retriever}, ... } ): Invalid retriever option. A retriever must be a function that accepts a string ID and returns the requested resource. ${ERROR_NOT_MY_FAULT}`
			),
			invalidDeferrer: (defer) => (
				`FATAL: new Guarantor( { defer: ~${typeof defer}, ... } ): Invalid defer option. A defer must be any object with a .then() property. ${ERROR_NOT_MY_FAULT}`
			),
			invalidInitializer: (initializer) => (
				`FATAL: new Guarantor( { initializer: ~${typeof initializer}, ... } ): Invalid initializer option. An initializer must be a function that accepts a string ID and its associated guarantee, and returns the final value of the guarantee. ${ERROR_NOT_MY_FAULT}`
			),
			invalidThenableApi: (thenableApi) => (
				`FATAL: new Guarantor( { thenableApi: ~${typeof thenableApi}, ... } ): Invalid Thenable API option. A Thenable API must be a prototype or class that provides its instances with a .then() method. This is a highly advanced and nuanced feature. Most of the time, you can leave this blank to use the built-in "Promise" class.`
			),
		},
		get: {
			requiredIdentifier: () => (
				`Guarantor.get( identifier ): Missing required parameter: identifier. ${ERROR_NOT_MY_FAULT}`
			),
			retrieverError: (identifier) => (
				`Guarantor.retriever( identifier: "${identifier}" ): An error occurred when trying to retrieve the referenced identifier. ${ERROR_NOT_MY_FAULT}`
			),
			undefinedGuarantee: (identifier) => (
				`Guarantor.retriver( identifier: "${identifier}" ): The retriever for this guarantee returned "undefined", which will be used to fulfill it. Proceeding anyway. If this was unintended, it may be necessary to throw errors or return a rejected promise for edge cases that may have resulted in an undefined value. ${ERROR_NOT_MY_FAULT}`
			)
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
