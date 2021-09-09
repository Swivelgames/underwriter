/* eslint-disable import/first, no-unused-vars */
import assert from "assert";
import sinon from "sinon";
import crypto from "crypto";

import { ERRORS } from "./copy.js";
import { randomString } from "../test-utils.js";
import { formatName } from "./utils.js";

import Guarantor from "./guarantor.js";
import fulfill, { defaultInitializer } from "./fulfill.js";
/* eslint-enable no-unused-vars */

let instance;// = new Guarantor();
let mockRetriever = sinon.fake();

describe("underwriter::Guarantor", () => {
	beforeEach(() => {
	});

	afterEach(() => {
		sinon.reset();
	});

	describe("underwriter::constructor()", () => {
		it("should throw if no retriever is passed", () => {
			const expected = ERRORS.Guarantor.constructor.invalidRetriever();

			assert.throws(
				() => new Guarantor({}),
				({ message }) => message === expected
			);
		});

		it("should NOT throw if optional properties are omitted from options", () => new Guarantor({ retriever: mockRetriever }));

		it("should throw if an invalid retriever is passed", () => {
			const invalidRetriever = [];
			const expected = ERRORS.Guarantor.constructor.invalidRetriever(
				invalidRetriever
			);

			assert.throws(
				() => new Guarantor({ retriever: invalidRetriever }),
				({ message }) => message === expected
			);
		});

		it("should throw if an invalid defer is passed", () => {
			const invalidDeferrer = [];
			const expected = ERRORS.Guarantor.constructor.invalidDeferrer(
				invalidDeferrer
			);

			assert.throws(
				() => new Guarantor({
					retriever: mockRetriever,
					defer: invalidDeferrer,
				}),
				({ message }) => message === expected
			);
		});

		it("should throw if an invalid initializer is passed", () => {
			const invalidInitializer = [];
			const expected = ERRORS.Guarantor.constructor.invalidInitializer(
				invalidInitializer
			);

			assert.throws(
				() => new Guarantor({
					retriever: mockRetriever,
					initializer: invalidInitializer,
				}),
				({ message }) => message === expected
			);
		});

		it("should throw if an invalid Thenable API is passed", () => {
			let invalidThenableApi = null;
			let expected = ERRORS.Guarantor.constructor.invalidThenableApi(
				invalidThenableApi
			);

			assert.throws(
				() => new Guarantor({
					retriever: mockRetriever,
					thenableApi: invalidThenableApi,
				}),
				({ message }) => message === expected
			);

			invalidThenableApi = class {};
			expected = ERRORS.Guarantor.constructor.invalidThenableApi(
				invalidThenableApi
			);

			assert.throws(
				() => new Guarantor({
					retriever: mockRetriever,
					thenableApi: invalidThenableApi,
				}),
				({ message }) => message === expected
			);
		});

		it("should NOT expose a fulfill method if publicFulfill option is omitted", () => {
			instance = new Guarantor({
				retriever: mockRetriever,
			});

			assert.ok(!("fulfill" in instance));

			assert.ok(
				typeof instance.fulfill !== "function",
				"should have method called fulfill"
			);
		});

		it("should NOT expose a fulfill method if publicFulfill option is false", () => {
			instance = new Guarantor({
				retriever: mockRetriever,
				publicFulfill: false,
			});

			assert.ok(!("fulfill" in instance));

			assert.ok(
				typeof instance.fulfill !== "function",
				"should have method called fulfill"
			);
		});

		it("should expose a fulfill method if publicFulfill option is true", () => {
			instance = new Guarantor({
				retriever: mockRetriever,
				publicFulfill: true
			});

			assert.ok(
				typeof instance.fulfill === "function",
				"should have method called fulfill"
			);
		});

		it("should NOT throw if publicFulfill is true and no retriever is passed", () => {
			assert.ok(new Guarantor({ publicFulfill: true }));
		});
	});

	describe("underwriter:get( identifier )", () => {
		before(() => {
			instance = new Guarantor({
				retriever: mockRetriever,
			});
		});

		it("should reject if no identifier is passed", async () => {
			const expected = ERRORS.Guarantor.get.requiredIdentifier();

			await assert.rejects(
				() => instance.get(),
				({ message }) => message === expected
			);
		});

		it("should reject if an invalid identifier is passed", async () => {
			const invalidId = "";
			const expected = ERRORS.Guarantor.get.requiredIdentifier(
				invalidId
			);

			await assert.rejects(
				() => instance.get(invalidId),
				({ message }) => message === expected
			);
		});

		it("should reject if the retriever fails", async () => {
			const mockIdentifier = randomString();

			const expected = randomString();
			const mockRetrieverFail = sinon.fake.returns(
				Promise.reject(expected)
			);

			instance = new Guarantor({
				retriever: mockRetrieverFail,
			});

			await assert.rejects(
				() => instance.get(mockIdentifier),
				(err) => err === expected
			);
		});

		it("should create a promise and call the retriever", async () => {
			const mockIdentifier = randomString();
			const stubGuarantee = randomString();

			mockRetriever = sinon.fake(() => stubGuarantee);

			instance = new Guarantor({
				retriever: mockRetriever,
			});

			const actualRet = instance.get(mockIdentifier);

			assert.ok(
				typeof actualRet.then === "function",
				"should return a thenable"
			);

			await actualRet;

			assert.ok(
				!!mockRetriever.lastCall,
				"should call retriever()"
			);

			assert.ok(
				mockRetriever.lastCall.firstArg === mockIdentifier,
				"should pass identifier to retriever"
			);
		});

		it("should not produce new promises or call the retriever again on subsequent calls", async () => {
			const mockIdentifier = randomString();
			const stubGuarantee = randomString();

			mockRetriever = sinon.fake.returns(
				Promise.resolve(stubGuarantee)
			);

			instance = new Guarantor({
				retriever: mockRetriever,
			});

			const expected = instance.get(mockIdentifier);
			const actual = instance.get(mockIdentifier);

			await expected;

			assert.strictEqual(
				expected, actual,
				"should always return the same promise"
			);

			assert.equal(
				mockRetriever.callCount, 1,
				"should only call retriever() once"
			);
		});

		it("should wait to retrieve a guarantee until defer promise resolves if retrieveEarly is false", async () => {
			const mockIdentifier = randomString();
			const stubGuarantee = randomString();

			let deferResolve;
			const mockDeferrer = new Promise((resolve) => {
				deferResolve = resolve;
			});

			mockRetriever = sinon.fake.returns(
				Promise.resolve(stubGuarantee)
			);

			instance = new Guarantor({
				retriever: mockRetriever,
				defer: mockDeferrer,
				retrieveEarly: false,
			});

			const expected = instance.get(mockIdentifier);

			setTimeout(() => {
				assert.equal(
					mockRetriever.callCount, 0,
					"shouldn't call retriever yet"
				);
			}, 5);

			setTimeout(() => {
				deferResolve();
			}, 25);

			await expected;

			assert.equal(
				mockRetriever.callCount, 1,
				"should only call retriever() once"
			);
		});

		it("should immediately retrieve a guarantee if retrieveEarly is true", () => {
			const mockIdentifier = randomString();
			const stubGuarantee = randomString();

			const mockDeferrer = new Promise(() => {});

			mockRetriever = sinon.fake.returns(
				Promise.resolve(stubGuarantee)
			);

			instance = new Guarantor({
				retriever: mockRetriever,
				defer: mockDeferrer,
				retrieveEarly: true,
			});

			instance.get(mockIdentifier);

			return new Promise((resolve, reject) => {
				setTimeout(() => {
					try {
						assert.equal(
							mockRetriever.callCount, 1,
							"should have already called the retriever"
						);
					} catch (e) {
						reject(e);
					}
					resolve();
				}, 5);
			});
		});

		it("should fulfill even if retriever returns void", async () => {
			const mockIdentifier = randomString();
			const stubGuarantee = randomString();

			mockRetriever = sinon.fake.returns(
				Promise.resolve(void 0)
			);

			instance = new Guarantor({
				retriever: mockRetriever
			});

			await instance.get(mockIdentifier);
		});

		it("should NOT fulfill if retriever returns void, but publicFulfill is true", async () => {
			const mockIdentifier = randomString();
			const stubGuarantee = randomString();

			mockRetriever = sinon.fake.returns(
				Promise.resolve(void 0)
			);

			instance = new Guarantor({
				retriever: mockRetriever,
				publicFulfill: true,
			});

			let resolve;
			let reject;
			const prom = new Promise((res,rej) => {
				resolve = res;
				reject = rej;
			});

			instance.get(mockIdentifier).then(() => {
				reject("promise should not have been resolved");
			});

			setTimeout(() => {
				assert.equal(
					mockRetriever.callCount, 1,
					"retriever should be called once"
				);
				resolve();
			}, 10);

			return prom;
		});

		it("should not call the retriever if it was omitted and publicFulfill is true", async () => {
			const mockIdentifier = randomString();

			instance = new Guarantor({ publicFulfill: true });

			setTimeout(() => {
				instance.fulfill(mockIdentifier, true);
			}, 5);

			await instance.get(mockIdentifier);
		});

		it("internal: should not call the retriever if lazy is true", () => {
			const mockIdentifier = randomString();
			const stubGuarantee = randomString();

			mockRetriever = sinon.fake.returns(
				Promise.resolve(stubGuarantee)
			);

			instance = new Guarantor({
				retriever: mockRetriever,
			});

			instance.get(mockIdentifier, true);

			assert.equal(
				mockRetriever.callCount, 0,
				"should not be called if lazy is true"
			);
		});
	});

	describe("underwriter:fulfill( identifier, guarantee )", () => {
		it("should fulfill the guarantee matching the identifier", async () => {
			const mockIdentifier = randomString();
			const stubGuarantee = randomString();

			mockRetriever = sinon.fake(() => stubGuarantee);

			instance = new Guarantor({
				retriever: mockRetriever,
				publicFulfill: true,
			});

			await instance.fulfill(mockIdentifier, stubGuarantee);
			const ret = await instance.get(mockIdentifier);

			assert.strictEqual(stubGuarantee, ret);
		});
	});
});
