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

			mockRetriever = sinon.fake((id, ful) => ful(stubGuarantee));

			instance = new Guarantor({
				retriever: mockRetriever,
			});

			const actualRet = instance.get(mockIdentifier);
			// const resolvedResult = await actualRet;

			assert.ok(
				typeof actualRet.then === "function",
				"should return a thenable"
			);

			assert.ok(
				!!mockRetriever.lastCall,
				"should call retriever()"
			);

			const { firstArg, lastArg } = mockRetriever.lastCall;

			assert.ok(
				firstArg === mockIdentifier,
				"should pass identifier to retriever"
			);

			assert.ok(
				typeof lastArg === "function",
				"should pass a fulfill function to retriever"
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

			assert.strictEqual(
				expected, actual,
				"should always return the same promise"
			);

			assert.equal(
				mockRetriever.callCount, 1,
				"should only call retriever() once"
			);
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
