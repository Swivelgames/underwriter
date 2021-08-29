/* eslint-disable import/first, no-unused-vars */

import assert from "assert";
import sinon from "sinon";
import crypto from "crypto";
import { ERRORS } from "./copy.js";
import { WeakMapSpy, randomString } from "../test-utils.js";
// import { formatName } from "./utils.js";

import Guarantor, {
	PublicRegistry,
	DEFAULT_GUARANTOR,
	defaultInitializer
} from "./guarantor.js";
/* eslint-enable no-unused-vars */

let spyWeakMap;

let fakeGuarantee;

let mockInitializer;
let mockRetriever;
let mockIdentifier;
let mockQualifier;

let Instance;

describe("@exorsa/core::Guarantor", () => {
	before(() => {
		spyWeakMap = new WeakMapSpy();
		fakeGuarantee = sinon.fake();
		mockRetriever = sinon.fake.returns(
			Promise.resolve()
		);

		mockMemberDescriptor = {
			name: "membername",
			member: fakeGuarantee
		};

		mockInitializer = sinon.fake.returns(fakeGuarantee);
	});

	beforeEach(() => {
		mockQualifier = randomString();
		mockIdentifier = randomString();

		Instance = new Guarantor({
			qualifier: mockQualifier,
			promise: Promise.resolve(),
			initializer: mockInitializer,
		}, mockAgent);
	});

	afterEach(() => {
		spyWeakMap.delete(Instance);
		sinon.reset();
	});

	describe("constructor()", () => {
		it("should store arguments in a private weakmap", () => {
			const Private = spyWeakMap.get(Instance);

			assert.strictEqual(Private.agent, mockAgent);
			assert.strictEqual(Private.qualifier, mockQualifier);
			assert.ok(
				Private.parent instanceof Promise,
				"parent should be a promise"
			);
			assert.ok(
				Private.registry instanceof Set,
				"registry should be a Set"
			);
			assert.ok(
				Private.resolvers instanceof Map,
				"resolvers should be a Map"
			);
			assert.ok(
				Private.promises instanceof Map,
				"promises should be a Map"
			);
		});
	});

	describe("get()", () => {
		it("should reject if no member name is passed", () => {
			const expected = (
				ERRORS.Guarantor.get.requiredMember(mockQualifier)
			);
			assert.rejects(
				Instance.get.bind(Instance), expected,
				"should throw ERRORS.Guarantor.get.requiredMember"
			);
		});

		it("should reject if an invalid member name is passed", () => {
			const localFakeMember = {};
			const expected = ERRORS.Guarantor.get.requiredMember(
				mockQualifier, localFakeMember
			);
			assert.rejects(
				() => Instance.get(localFakeMember), expected,
				"should throw ERRORS.Guarantor.get.requiredMember"
			);
		});

		describe("agent.retrieve()", () => {
			it("should request qualifier from exorsa if the qualifier does not yet exist", () => {
				const fakeGuaranteeName = randomString();
				Instance.get(fakeGuaranteeName);

				assert.ok(
					!!mockRetriever.lastCall,
					"retrieve() must be called"
				);
				assert.ok(
					mockRetriever.lastCall.calledWith(
						mockQualifier, fakeGuaranteeName
					),
					"retrieve() must be called with qualifierName and memberName requested"
				);
			});

			it("should reject qualifier if exorsa agent.retrieve() is rejected", () => {
				const expectedError = randomString();
				const mockLocalAgent = {
					...mockAgent,
					retrieve: sinon.fake.returns(
						() => Promise.reject(expectedError)
					),
				};

				const localFakeTypeName = randomString();

				const localInstance = new Guarantor({
					qualifier: localFakeTypeName,
					promise: Promise.resolve(),
					initializer: mockInitializer,
				}, mockLocalAgent);
				const Private = spyWeakMap.get(localInstance);

				const fakeGuaranteeName = randomString();
				localInstance.get(fakeGuaranteeName);

				assert.ok(
					!!mockLocalAgent.retrieve.lastCall,
					"retrieve() must be called"
				);
				assert.ok(
					mockLocalAgent.retrieve.lastCall.calledWith(
						localFakeTypeName, fakeGuaranteeName
					),
					"retrieve() must be called with qualifierName and memberName requested"
				);
				assert.rejects(
					Private.promises.get(fakeGuaranteeName), expectedError
				);
			});
		});

		it("should return a new promise if the member does not yet exist", () => {
			const Private = spyWeakMap.get(Instance);

			const fakeGuaranteeName = randomString();

			assert.ok(
				!Private.registry.has(fakeGuaranteeName),
				"qualifier should not exist in registry yet"
			);
			assert.ok(
				!Private.resolvers.has(fakeGuaranteeName),
				"qualifier should not have a resolver yet"
			);
			assert.ok(
				!Private.promises.has(fakeGuaranteeName),
				"qualifier should not have a promise yet"
			);

			const actual = Instance.get(fakeGuaranteeName);
			const expected = Private.promises.get(fakeGuaranteeName);

			// Registry signifies when a member has been registered
			assert.ok(
				!Private.registry.has(fakeGuaranteeName),
				"qualifier still shouldn't be in the registry"
			);

			// Resolvers and promises should be populated regardless
			assert.ok(
				Private.resolvers.has(fakeGuaranteeName),
				"qualifier should now have a resolver"
			);
			assert.ok(
				Private.promises.has(fakeGuaranteeName),
				"qualifier should now have a promise"
			);
			assert.strictEqual(actual, expected);
		});

		it("should invoke exorsa.retrieve if the member does not yet exist", () => {
			const Private = spyWeakMap.get(Instance);

			const fakeGuaranteeName = randomString();

			assert.ok(
				!Private.registry.has(fakeGuaranteeName),
				"qualifier should not exist in registry"
			);
			assert.ok(
				!Private.resolvers.has(fakeGuaranteeName),
				"qualifier should not have a resolver"
			);
			assert.ok(
				!Private.promises.has(fakeGuaranteeName),
				"qualifier should not have a promise"
			);

			Instance.get(fakeGuaranteeName);

			assert.strictEqual(mockRetriever.callCount, 1);
		});

		it("should return the same promise for every request to ther same member", () => {
			const Private = spyWeakMap.get(Instance);

			const fakeGuaranteeName = randomString();

			const actual1 = Instance.get(fakeGuaranteeName);
			const actual2 = Instance.get(fakeGuaranteeName);
			const expected = Private.promises.get(fakeGuaranteeName);

			assert.strictEqual(actual1, expected);
			assert.strictEqual(actual2, expected);
		});
	});

	describe("register()", () => {
		it("should reject if no member descriptor is passed", () => {
			const expected = (
				ERRORS.Guarantor.register.requiredMemberDesc()
			);
			assert.rejects(
				Instance.register.bind(Instance), expected,
				"should throw ERRORS.Guarantor.register.requiredMemberDesc"
			);
		});

		it("should reject if an invalid member descriptor is passed", () => {
			const invalidMemDesc = {};
			const expected = ERRORS.Guarantor.register.requiredMemberDesc(
				invalidMemDesc
			);
			assert.rejects(
				() => Instance.register(invalidMemDesc), expected,
				"should throw ERRORS.Guarantor.register.requiredMemberDesc"
			);
		});

		it("should reject if the member has already been registered", () => {
			const fakeGuaranteeName = randomString();
			const { registry } = spyWeakMap.get(Instance);

			registry.add(fakeGuaranteeName);

			const expected = (
				ERRORS.Guarantor.register.memberAlreadyDefined(
					fakeGuaranteeName
				)
			);

			assert.rejects(
				() => (
					Instance.register({
						name: fakeGuaranteeName,
						member: () => {}
					})
				),
				expected,
				"should throw ERRORS.Guarantor.register.memberAlreadyDefined"
			);
		});

		it("should register and initialize a valid member", () => {
			const Private = spyWeakMap.get(Instance);

			// Make sure the member hasn't been registered yet
			assert.ok(
				!Private.registry.has(mockIdentifier),
				"qualifier should not exist in registry yet"
			);

			// We also want to make sure the promises and resolvers are being created
			assert.ok(
				!Private.resolvers.has(mockIdentifier),
				"qualifier should not have a resolver yet"
			);
			assert.ok(
				!Private.promises.has(mockIdentifier),
				"qualifier should not have a promise yet"
			);

			const promiseActual = Instance.fulfill(
				mockIdentifier, mockGuarantee
			);

			return promiseActual.then((member) => {
				const promiseExpected = Private.promises.get(mockIdentifier);
				assert.strictEqual(promiseActual, promiseExpected);

				assert.ok(
					Private.registry.has(mockIdentifier),
					"should add the member's name to the registry"
				);

				// ''
				assert.strictEqual(
					mockAgent.getAll.callCount, 1,
					"should attempt to load all dependencies first"
				);

				assert.strictEqual(
					mockInitializer.callCount, 1,
					"should initialize the member using its parent"
				);

				assert.strictEqual(
					member, mockIdentifier,
					"should resolve the stored promise"
				);
			});
		});
	});
});
