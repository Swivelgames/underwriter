/* eslint-disable no-unused-vars * /
import assert from "assert";
/* eslint-enable no-unused-vars * /
import { ERRORS } from "./copy.js";
import {
	isClass,
	formatName,
	initializeIfNeeded,
	deepGet,
	deepSet,
	deepArrayToObject
} from "./utils.js";

describe("@exorsa/core::utils", () => {
	describe("isClass()", () => {
		it("should return true if a class is passed to it", () => {
			assert(isClass(class {}));
		});

		it("should return true if a prototype is passed to it", () => {
			const proto = function proto() {};
			proto.prototype.foobar = "";
			assert(isClass(proto));
		});

		// it('should return false if an arrow function is passed to it', () => {
		// 	assert(!isClass(() => {}));
		// });

		it("should return false if an object is passed to it", () => {
			const fakeProto = { prototype: {} };
			assert(!isClass(fakeProto));
		});
	});

	describe("formatName()", () => {
		it("should return lowercased version of a string", () => {
			assert.equal(formatName("FooBaR"), "foobar");
		});

		it("should cast other types to string", () => {
			assert.strictEqual(formatName(123), "123");
		});
	});

	describe("initializeIfNeeded()", () => {
		it("should initialize a missing key", () => {
			const map1 = new Map();
			const key = "foobar";

			assert(!map1.has(key));

			const preMapVal = map1.get(key);
			const value = initializeIfNeeded(map1, key);
			assert.notEqual(value, preMapVal);

			assert(value instanceof Map);
		});

		it("should initialize a missing key with a specific value factory", () => {
			const map1 = new Map();
			const key = "foobar";
			const value = initializeIfNeeded(map1, key, () => new Set());
			assert(value instanceof Set);
		});

		it("should preserve the original value if a key already exists", () => {
			const map1 = new Map();
			const key = "foobar";
			const originalValue = {};
			map1.set(key, originalValue);

			assert(map1.has(key));

			const preValue = map1.get(key);
			const value = initializeIfNeeded(map1, key);
			assert.strictEqual(preValue, originalValue);
			assert.strictEqual(value, originalValue);
		});
	});

	describe("deepGet()", () => {
		it("should retrieve the value for the given key", () => {
			const key = "foo";
			const expected = "bar";

			const mockObj = {
				[key]: expected
			};

			const actual = deepGet(mockObj, [key]);

			assert.strictEqual(actual, expected);
		});

		it("should retrieve the value for a deep key", () => {
			const key1 = "foo";
			const key2 = "bar";
			const expected = "baz";

			const mockObj = {
				[key1]: {
					[key2]: expected
				}
			};

			const actual = deepGet(mockObj, [key1, key2]);

			assert.strictEqual(actual, expected);
		});

		it("should create the key if it doesn't exist", () => {
			const key1 = "foo";
			const key2 = "bar";

			const mockObj = {};

			const actual = deepGet(mockObj, [key1, key2], true);
			assert.ok(actual instanceof Object, "result must be object");
			assert.ok(key1 in mockObj, "key1 must be inside object");
			assert.ok(
				key2 in mockObj[key1],
				"key2 must be inside object[key1]"
			);
			assert.strictEqual(actual, mockObj[key1][key2]);
		});

		it("should throw if create is disabled and key doesn't exist", () => {
			const key1 = "foo";
			const key2 = "bar";

			const mockObj = {};

			const shouldFail = () => deepGet(mockObj, [key1, key2], false);
			const expected = ERRORS.utils.deepGet.getFromNonObject(
				[key1, key2].join("."), key1, typeof mockObj
			);
			assert.throws(
				shouldFail, (err) => {
					assert.equal(err.message, expected);
					return true;
				}, "should throw ERRORS.utils.deepGet.getFromNonObject"
			);
			assert.ok(!(key1 in mockObj), "key1 should not be inside object");
		});

		it("should throw if getting deep key on non-object", () => {
			const key1 = "foo";
			const key2 = "bar";

			const mockObj = {
				[key1]: false
			};

			const shouldFail = () => deepGet(mockObj, [key1, key2]);
			const expected = ERRORS.utils.deepGet.getFromNonObject(
				[key1, key2].join("."), key2, typeof mockObj[key1]
			);
			assert.throws(
				shouldFail, (err) => {
					assert.equal(err.message, expected);
					return true;
				}, "should throw ERRORS.utils.deepGet.getFromNonObject"
			);
		});
	});

	describe("deepSet()", () => {
		it("should change the value of the given key", () => {
			const key = "foo";
			const oldValue = "bar";
			const newValue = "baz";

			const mockObj = {
				[key]: oldValue
			};

			deepSet(mockObj, [key], newValue);

			assert.notEqual(mockObj[key], oldValue);
			assert.strictEqual(mockObj[key], newValue);
		});

		it("should change the value of the given deep key", () => {
			const key1 = "foo";
			const key2 = "bar";
			const oldValue = "baz";
			const newValue = "quux";

			const mockObj = {
				[key1]: {
					[key2]: oldValue
				}
			};

			deepSet(mockObj, [key1, key2], newValue);

			assert.notEqual(mockObj[key1][key2], oldValue);
			assert.strictEqual(mockObj[key1][key2], newValue);
		});

		it("should create the key for a given value if it does not exist", () => {
			const key1 = "foo";
			const key2 = "bar";
			const oldValue = "baz";
			const newValue = "quux";

			const mockObj = {
				[key1]: {}
			};

			deepSet(mockObj, [key1, key2], newValue);

			assert.notEqual(mockObj[key1][key2], oldValue);
			assert.strictEqual(mockObj[key1][key2], newValue);
		});
	});

	describe("deepArrayToObject()", () => {
		it("should create an object given keys and values", () => {
			const keys = ["foo", "bar"];
			const values = ["baz", "quux"];

			const expected = {
				[keys[0]]: values[0],
				[keys[1]]: values[1]
			};

			const actual = deepArrayToObject(keys, values);

			assert.deepStrictEqual(actual, expected);
		});

		it("should create an object given deep keys and values", () => {
			const keys = ["foo", ["bar", "baz"]];
			const values = ["quux", "corge"];

			const expected = {
				[keys[0]]: values[0],
				[keys[1][0]]: {
					[keys[1][1]]: values[1]
				}
			};

			const actual = deepArrayToObject(keys, values);

			assert.deepStrictEqual(actual, expected);
		});
	});
});
/ **/
