/* eslint-disable no-unused-vars */
import assert from "assert";
/* eslint-enable no-unused-vars */

import {
	formatName,
	initializeIfNeeded,
} from "./utils.js";

describe("underwriter::utils", () => {
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
});
