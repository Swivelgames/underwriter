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

const fakeRegistry = new Set();
const fakeResolvers = new Map();

let mockInstance;// = sinon.createStubInstance(Guarantor);
let mockIdentifier;// = randomString();
let mockGuarantee;// = randomString();
let mockPromise;// = getMockPromise();
let mockPriv;// = getMockPriv();

const mockParent = Promise.resolve();

const getMockPromise = () => (
	new Promise((resolve, reject) => {
		fakeResolvers.set(
			formatName(mockIdentifier),
			{ resolve, reject }
		);
	})
);

const getMockResult = () => ({
	identifier: mockIdentifier,
	guarantee: mockGuarantee,
});

const fakeInitializer = sinon.fake(
	() => getMockResult()
);

const getMockPriv = () => ({
	parent: mockParent,
	registry: fakeRegistry,
	resolvers: fakeResolvers,
	initializer: fakeInitializer,
});

describe("berth::fulfill", () => {
	beforeEach(() => {
		mockInstance = sinon.createStubInstance(Guarantor);
		mockIdentifier = randomString();
		mockGuarantee = randomString();
		mockPriv = getMockPriv();
		mockPromise = getMockPromise();

		mockInstance.get.returns(mockPromise);
	});

	afterEach(() => {
		sinon.reset();
	});

	it("should reject if the identifier has already been fulfilled", async () => {
		const expected = (
			ERRORS.Fulfill.guaranteeAlreadyRegistered(mockIdentifier)
		);

		mockPriv.registry.add(
			formatName(mockIdentifier)
		);

		await assert.rejects(
			() => fulfill(null, mockPriv, mockIdentifier),
			{ message: expected },
			"should reject with ERRORS.Fulfill.guaranteeAlreadyRegistered"
		);
	});

	it("should fulfill the guarantee", async () => {
		const expectedResolve = getMockResult();
		const expectedResult = mockPromise;

		const actualResult = fulfill(
			mockInstance, mockPriv, mockIdentifier, mockGuarantee
		);

		assert.strictEqual(
			expectedResult,
			actualResult,
			"should return the same promise provided by the Guarantor"
		);

		const actualResolve = await actualResult;

		assert.ok(
			fakeRegistry.has(mockIdentifier),
			"should add itself to the registry"
		);

		assert.ok(
			fakeInitializer.lastCall.calledWith(mockIdentifier, mockGuarantee),
			"should call initializer with identifier and guarantee"
		);

		assert.deepStrictEqual(
			actualResolve,
			expectedResolve,
		);
	});

	describe("berth::defaultInitializer", () => {
		it("should return an object containing the identifier and guarantee", () => {
			const expected = {
				identifier: mockIdentifier,
				guarantee: mockGuarantee,
			};

			const actual = defaultInitializer(mockIdentifier, mockGuarantee);

			assert.deepStrictEqual(
				actual,
				expected,
			);
		});
	});
});
