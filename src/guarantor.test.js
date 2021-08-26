/* eslint-disable import/first, no-unused-vars */

import assert from "assert";
import sinon from "sinon";
import crypto from "crypto";
import { ERRORS } from "./copy.js";
import { WeakMapSpy, randomString } from "../test-utils.js";
import { formatName } from "./utils.js";

import Guarantor, {
	PublicRegistry,
	DEFAULT_GUARANTOR,
	defaultInitializer
} from "./guarantor.js";
/* eslint-enable no-unused-vars */

let spyWeakMap;
// let fakeMember;
// let mockParent;
// let mockAgent;
// let mockMemberDescriptor;
let Instance;
let instanceQual;

let mockGuarantee = randomString();
let mockRetriever = sinon.fake.returns(
	Promise.resolve(mockGuarantee)
);

Guarantor.getAll = sinon.fake.returns(
	Promise.resolve([{
		qualifier: 'mock',
		identifier: 'mock',
		guarantee: mockGuarantee,
	}])
);

describe("berth::Guarantor", () => {
	before(() => {
		spyWeakMap = new WeakMapSpy();
	});

	// beforeEach(() => {
	// 	Instance = new MemberRegistry({
	// 		type: fakeTypeName,
	// 		promise: Promise.resolve(mockParent)
	// 	}, mockAgent);
	// });

	afterEach(() => {
		spyWeakMap.delete(Instance);
		sinon.reset();
	});

	describe("constructor()", () => {
		beforeEach(() => {
			instanceQual = randomString();
		});

		describe(".retriever", () => {
			it("throw: if retriever is not passed", () => {
				const expected = (
					ERRORS.Guarantor.constructor.invalidRetriever(
						instanceQual
					)
				);

				assert.throws(
					() => Instance = new Guarantor({
						qualifier: instanceQual,
					}),
					(err) => {
						assert.equal(err.message, expected)
						return true;
					},
					"expecting ERRORS.Guarantor.constructor.invalidRetriever"
				);
			});

			it("throw: if an invalid retriever is passed", () => {
				const invalidRetriever = [];
				const expected = ERRORS.Guarantor.constructor.invalidRetriever(
					instanceQual, invalidRetriever
				);

				assert.throws(
					() => Instance = new Guarantor({
						qualifier: instanceQual,
						retriever: invalidRetriever,
					}),
					(err) => {
						assert.equal(err.message, expected)
						return true;
					},
					"expecting ERRORS.Guarantor.constructor.invalidRetriever"
				);
			});
		});

		describe(".addressable", () => {
			it("should assign self to public registry if addressable option is true", () => {
				Instance = new Guarantor({
					qualifier: instanceQual,
					retriever: mockRetriever,
				});

				const Private = spyWeakMap.get(Instance);

				assert.ok(
					"addressable" in Private,
					"should set options.addressable to Private vars"
				);

				assert.ok(
					Private.addressable === true,
					"should set options.addressable to true by default"
				);
			});

			it("should assign self to public registry if addressable option is true", () => {
				assert.ok(
					PublicRegistry instanceof Map,
					"should export Map called PublicRegistry"
				);

				Instance = new Guarantor({
					qualifier: instanceQual,
					retriever: mockRetriever,
					addressable: true,
				});

				assert.ok(
					PublicRegistry.has(instanceQual),
					"should set qualifier as key of PublicRegistry map"
				);

				assert.ok(
					PublicRegistry.get(instanceQual) === Instance,
					"should store Instance in PublicRegistry map"
				);
			});

			it("throw: if qualifier is already assigned to public registry", () => {
				assert.ok(
					PublicRegistry instanceof Map,
					"should export Map called PublicRegistry"
				);

				const existing = new Guarantor({
					qualifier: instanceQual,
					retriever: mockRetriever,
				});

				const expected = (
					ERRORS.Guarantor.constructor.qualifierTaken(
						instanceQual, DEFAULT_GUARANTOR
					)
				);

				assert.throws(
					() => Instance = new Guarantor({
						qualifier: instanceQual,
						retriever: mockRetriever,
					}),
					(err) => {
						assert.equal(err.message, expected)
						return true;
					},
					"expecting ERRORS.Guarantor.constructor.qualifierTaken"
				);
			});
		});
	});

	describe("fulfill( identifier, guarantee, dependencies = [] )", () => {
		beforeEach(() => {
			instanceQual = randomString();
			Instance = new Guarantor({
				qualifier: instanceQual,
				retriever: mockRetriever,
				addressable: true,
			});
		});

		it("rejects: if identifier is not a string", () => {
			const args = {
				identifier: randomString(),
				guarantee: mockGuarantee,
				dependencies: [],
			};

			const invalidId = [];
			const dependencies = [];
			const expected = ERRORS.Guarantor.fulfill.requiredIdentifier(
				invalidId, instanceQual
			);

			assert.rejects(
				Instance.fulfill(
					invalidId,
					mockGuarantee,
					dependencies
				),
				(err) => {
					assert.equal(err.message, expected)
					return true;
				},
				"expecting ERRORS.Guarantor.fulfill.requiredIdentifier"
			);
		});

		it("rejects: if identifier is an empty string", () => {
			const args = {
				identifier: "",
				guarantee: mockGuarantee,
				dependencies: [],
			};

			const invalidId = [];
			const dependencies = [];
			const expected = ERRORS.Guarantor.fulfill.requiredIdentifier(
				invalidId, instanceQual
			);

			assert.rejects(
				Instance.fulfill(
					invalidId,
					mockGuarantee,
					dependencies
				),
				(err) => {
					assert.equal(err.message, expected)
					return true;
				},
				"expecting ERRORS.Guarantor.fulfill.requiredIdentifier"
			);
		});
	});
});

/*
		it("should store arguments in a private weakmap", () => {
			const Private = spyWeakMap.get(Instance);

			assert.strictEqual(Private.agent, mockAgent);
			assert.strictEqual(Private.type, fakeTypeName);
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
				ERRORS.MemberRegistry.get.requiredMember(fakeTypeName)
			);
			assert.rejects(
				Instance.get.bind(Instance), expected,
				"should throw ERRORS.MemberRegistry.get.requiredMember"
			);
		});

		it("should reject if an invalid member name is passed", () => {
			const localFakeMember = {};
			const expected = ERRORS.MemberRegistry.get.requiredMember(
				fakeTypeName, localFakeMember
			);
			assert.rejects(
				() => Instance.get(localFakeMember), expected,
				"should throw ERRORS.MemberRegistry.get.requiredMember"
			);
		});

		describe("agent.retrieve()", () => {
			it("should request type from exorsa if the type does not yet exist", () => {
				const fakeMemberName = randomString();
				Instance.get(fakeMemberName);

				assert.ok(
					!!mockAgent.retrieve.lastCall,
					"retrieve() must be called"
				);
				assert.ok(
					mockAgent.retrieve.lastCall.calledWith(
						fakeTypeName, fakeMemberName
					),
					"retrieve() must be called with typeName and memberName requested"
				);
			});

			it("should reject type if exorsa agent.retrieve() is rejected", () => {
				const expectedError = randomString();
				const mockLocalAgent = {
					...mockAgent,
					retrieve: sinon.fake.returns(
						() => Promise.reject(expectedError)
					),
				};

				const localFakeTypeName = randomString();

				const localInstance = new MemberRegistry({
					type: localFakeTypeName,
					promise: Promise.resolve(mockParent)
				}, mockLocalAgent);
				const Private = spyWeakMap.get(localInstance);

				const fakeMemberName = randomString();
				localInstance.get(fakeMemberName);

				assert.ok(
					!!mockLocalAgent.retrieve.lastCall,
					"retrieve() must be called"
				);
				assert.ok(
					mockLocalAgent.retrieve.lastCall.calledWith(
						localFakeTypeName, fakeMemberName
					),
					"retrieve() must be called with typeName and memberName requested"
				);
				assert.rejects(
					Private.promises.get(fakeMemberName), expectedError
				);
			});
		});

		it("should return a new promise if the member does not yet exist", () => {
			const Private = spyWeakMap.get(Instance);

			const fakeMemberName = randomString();

			assert.ok(
				!Private.registry.has(fakeMemberName),
				"type should not exist in registry yet"
			);
			assert.ok(
				!Private.resolvers.has(fakeMemberName),
				"type should not have a resolver yet"
			);
			assert.ok(
				!Private.promises.has(fakeMemberName),
				"type should not have a promise yet"
			);

			const actual = Instance.get(fakeMemberName);
			const expected = Private.promises.get(fakeMemberName);

			// Registry signifies when a member has been registered
			assert.ok(
				!Private.registry.has(fakeMemberName),
				"type still shouldn't be in the registry"
			);

			// Resolvers and promises should be populated regardless
			assert.ok(
				Private.resolvers.has(fakeMemberName),
				"type should now have a resolver"
			);
			assert.ok(
				Private.promises.has(fakeMemberName),
				"type should now have a promise"
			);
			assert.strictEqual(actual, expected);
		});

		it("should invoke exorsa.retrieve if the member does not yet exist", () => {
			const Private = spyWeakMap.get(Instance);

			const fakeMemberName = randomString();

			assert.ok(
				!Private.registry.has(fakeMemberName),
				"type should not exist in registry"
			);
			assert.ok(
				!Private.resolvers.has(fakeMemberName),
				"type should not have a resolver"
			);
			assert.ok(
				!Private.promises.has(fakeMemberName),
				"type should not have a promise"
			);

			Instance.get(fakeMemberName);

			assert.strictEqual(mockAgent.retrieve.callCount, 1);
		});

		it("should return the same promise for every request to ther same member", () => {
			const Private = spyWeakMap.get(Instance);

			const fakeMemberName = randomString();

			const actual1 = Instance.get(fakeMemberName);
			const actual2 = Instance.get(fakeMemberName);
			const expected = Private.promises.get(fakeMemberName);

			assert.strictEqual(actual1, expected);
			assert.strictEqual(actual2, expected);
		});
	});

	describe("register()", () => {
		it("should reject if no member descriptor is passed", () => {
			const expected = (
				ERRORS.MemberRegistry.register.requiredMemberDesc()
			);
			assert.rejects(
				Instance.register.bind(Instance), expected,
				"should throw ERRORS.MemberRegistry.register.requiredMemberDesc"
			);
		});

		it("should reject if an invalid member descriptor is passed", () => {
			const invalidMemDesc = {};
			const expected = ERRORS.MemberRegistry.register.requiredMemberDesc(
				invalidMemDesc
			);
			assert.rejects(
				() => Instance.register(invalidMemDesc), expected,
				"should throw ERRORS.MemberRegistry.register.requiredMemberDesc"
			);
		});

		it("should reject if the member has already been registered", () => {
			const fakeMemberName = randomString();
			const { registry } = spyWeakMap.get(Instance);

			registry.add(fakeMemberName);

			const expected = (
				ERRORS.MemberRegistry.register.memberAlreadyDefined(
					fakeMemberName
				)
			);

			assert.rejects(
				() => (
					Instance.register({
						name: fakeMemberName,
						member: () => {}
					})
				),
				expected,
				"should throw ERRORS.MemberRegistry.register.memberAlreadyDefined"
			);
		});

		it("should register and initialize a valid member", () => {
			const Private = spyWeakMap.get(Instance);
			const mock = mockMemberDescriptor;

			// Make sure the member hasn't been registered yet
			assert.ok(
				!Private.registry.has(mock.name),
				"type should not exist in registry yet"
			);

			// We also want to make sure the promises and resolvers are being created
			assert.ok(
				!Private.resolvers.has(mock.name),
				"type should not have a resolver yet"
			);
			assert.ok(
				!Private.promises.has(mock.name),
				"type should not have a promise yet"
			);

			const promiseActual = Instance.register(mock);

			return promiseActual.then((member) => {
				const promiseExpected = Private.promises.get(mock.name);
				assert.strictEqual(promiseActual, promiseExpected);

				assert.ok(
					Private.registry.has(mock.name),
					"should add the member's name to the registry"
				);

				// ''
				assert.strictEqual(
					mockAgent.getAll.callCount, 1,
					"should attempt to load all dependencies first"
				);

				assert.strictEqual(
					mockParent.initialize.callCount, 1,
					"should initialize the member using its parent"
				);

				assert.strictEqual(
					member, mockMemberDescriptor.member,
					"should resolve the stored promise"
				);
			});
		});
	});
});
*/
