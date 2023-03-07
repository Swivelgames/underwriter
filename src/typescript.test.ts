import assert from "assert";
import sinon from "sinon";
import Guarantor from 'underwriter';

import { randomString } from "../test-utils.js";

let instance;// = new Guarantor();
let mockRetriever = sinon.fake();

describe("underwriter.ts::Guarantor", () => {
	describe("underwriter.ts::constructor()", () => {
		it("should NOT throw if optional properties are omitted from options", () => {
			new Guarantor<unknown>({ retriever: mockRetriever })
		});
	});

	describe("underwriter.ts:get( identifier )", () => {
		before(() => {
			instance = new Guarantor({
				retriever: mockRetriever,
			});
		});

		it("should create a promise and call the retriever", async () => {
			const mockIdentifier: string = randomString();
			const stubGuarantee: string = randomString();

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
				expected, actual, "should always return the same promise"
			);

			assert.equal(
				mockRetriever.callCount, 1, "should only call retriever() once"
			);
		});

		it("should wait to retrieve a guarantee until defer promise resolves if retrieveEarly is false", async () => {
			const mockIdentifier = randomString();
			const stubGuarantee = randomString();

			let deferResolve: CallableFunction;
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
					mockRetriever.callCount, 0, "shouldn't call retriever yet"
				);
			}, 5);

			setTimeout(() => {
				deferResolve();
			}, 25);

			await expected;

			assert.equal(
				mockRetriever.callCount, 1, "should only call retriever() once"
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

			return new Promise<void>((resolve, reject) => {
				setTimeout(() => {
					try {
						assert.equal(
							mockRetriever.callCount, 1, "should have already called the retriever"
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

			mockRetriever = sinon.fake.returns(
				Promise.resolve(void 0)
			);

			instance = new Guarantor({
				retriever: mockRetriever
			});

			await instance.get(mockIdentifier);
		});
	});
});
