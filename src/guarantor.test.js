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

		it("should throw if an invalid parent is passed", () => {
			const invalidParent = [];
			const expected = ERRORS.Guarantor.constructor.invalidParent(
				invalidParent
			);

			assert.throws(
				() => new Guarantor({
					retriever: mockRetriever,
					parent: invalidParent,
				}),
				({ message }) => message === expected
			);
		});

		it("should NOT throw if no initializer is passed", () => new Guarantor({ retriever: mockRetriever }));

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

			invalidThenableApi = class{};
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

			const { firstArg, lastArg } = mockRetriever.lastCall;

			assert.ok(
				firstArg === mockIdentifier,
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

		it("should wait to retrieve a guarantee until parent promise resolves if waitToRetrieve is true", async () => {
			const mockIdentifier = randomString();
			const stubGuarantee = randomString();

			let parentResolve;
			const mockParent = new Promise((resolve) => {
				parentResolve = resolve;
			});

			mockRetriever = sinon.fake.returns(
				Promise.resolve(stubGuarantee)
			);

			instance = new Guarantor({
				retriever: mockRetriever,
				parent: mockParent,
				waitToRetrieve: true,
			});

			const expected = instance.get(mockIdentifier);

			await Promise.resolve().then(async () => {
				setTimeout(() => {
					parentResolve();
				}, 100);

				setTimeout(() => {
					assert.equal(
						mockRetriever.callCount, 0,
						"shouldn't call retriever yet"
					);
				}, 25);

				await expected;

				assert.equal(
					mockRetriever.callCount, 1,
					"should only call retriever() once"
				);
			});
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
});
