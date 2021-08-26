/* eslint-disable import/prefer-default-export */
import crypto from "crypto";

const oldWeakMap = global.WeakMap;
const WeakMapInstance = new WeakMap();

class WeakMapSpy {
	constructor() {
		this.instance = WeakMapInstance;
	}

	/* eslint-disable class-methods-use-this */
	antidote() {
		global.WeakMap = oldWeakMap;
		console.warn("global WeakMap cured");
	}
	/* eslint-enable class-methods-use-this */

	delete(...args) {
		return this.instance.delete(...args);
	}

	has(...args) {
		return this.instance.has(...args);
	}

	set(...args) {
		return this.instance.set(...args);
	}

	get(...args) {
		return this.instance.get(...args);
	}
}

console.warn("Poisoning global WeakMap");
Object.defineProperty(global, "WeakMap", { value: WeakMapSpy, configurable: false, writable: false });

const randomString = (len = 20) => crypto.randomBytes(len).toString("hex");

export {
	WeakMapSpy,
	randomString,
};
