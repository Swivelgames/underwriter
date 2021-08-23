/* eslint-disable import/prefer-default-export */
import sinon from "sinon";
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

const sinonImport = (ret) => {
	let fake;
	if (ret === void 0) {
		fake = sinon.fake.returns(ret);
	} else {
		fake = sinon.fake();
	}

	const oldImport = global.import;
	Object.defineProperty(global, "import", { value: fake });

	return fake;
};

export {
	WeakMapSpy,
	randomString,
	sinonImport
};
