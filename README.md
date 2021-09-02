# Underwriter

A simple, yet powerful, Promise Registry.


# How It Works

Underwriter provides access to Guarantors, which are simple interfaces for retrieving Promises by name. These promises can either be Resolved with a `guarantee` or Rejected with an error.

1. A Guarantor is basically an object that holds Promises
2. Each Promise (guarantee) has a name (identifier)
3. When you call `.get(identifier)`, you get a Promise back, and the `retriever()` is called
4. Once `retriever()` fetches the value, an optional `initializer()` can be used to parse/initialize the value
5. Once that is complete, the value is given to anyone who calls `.get(identifier)`

In more ambiguous terms (`:^)`), Underwriter uses `Guarantors` to provide consumers with a method of retrieving named `guarantees` from its registries.

Guarantors are general purpose, and can be used for anything, from asynchronously importing ESM modules using `import()`, one-time retrieval of static resources from an API/CDN/wherever, or anything else you can think of. It can even be used for retrieving interfaces for things already loaded in your environment, like UI Components, Controllers, Models, Stores, Actions, et cetera.

# Quick Usage

```javascript
import Guarantor from "underwriter";
const options = { retriever: (identifier) => fetchSomething(identifier) };
const guarantor = new Guarantor(options);
const resource = await guarantor.get(identifier);
```

1. Create a Guarantor (registry)
2. Supply a `retriever(identifier: string): Promise<guarantee>`
3. Request a `guarantee` with `Guarantor.get(identifier)`

## Example

**Remote Resource**
```javascript
// /configs/api.json
{
	configVersion: "2.3.15",
	config: {
		apiEndpoint: "/api/",
		apiVersion: "v1"
	}
}
```

**Guarantor**
```javascript
import Guarantor from "underwriter";

const retriever = (identifier) => (
	fetch(`/configs/${identifier}.json`).then(
		(response) => response.json
	)
);

// Optional
const initializer = (identifier, guarantee) => guarantee.config;

const configGuarantor = new Guarantor({
	retriever,
	initializer,
});

const apiConfig = await configGuarantor.get('api');
```


# Options


## _`function`_ `options.retriever` _Required_

TypeScript notation:
```typescript
type retriever = (identifier: string): Promise<any>;
```

The `retriever()` can be any function that accepts an `identifier` and resolves with a promise once the `guarantee` has been retrieved.
The `retriever` option is a function that is called whenever `.get(identifier)` is called. It is given an `identifier` and expected to retrieve the resource and return in it in the form of a promise. This may take the form of a Fetch/XHR/AJAX request, an `import()`, or as simply mapping the `identifier` to the `key` of an object.

For those that prefer TypeScript-like notation, the `retriever()` should follow something like:


## _`function`_ `options.initializer` _Optional_

TypeScript notation:
```typescript
type initializer = (identifier: string, guarantee: any): any;
```

The `initializer` is given the `identifier` and `guarantee` value after the resource is retrieved. It's role is to prepare the value for usage. Whatever it returns will be the value that is given to anyone who has requested this guarantee with `.get(identifier)`. This could conceivably be a santization function, a function that calls `JSON.parse()` on the input, or constructs a new class based on the data (e.g., `(id, guarantee) => new Foobar(guarantee)`).


### _`Promise`_ `option.defer` _Optional_

If you need a Guarantor to wait before it `retrieves` or `initializes` your guarantees, you can use the `defer` option, which takes a Promise (or any Thenable), and waits for it to resolve before continuing. This can be useful if you need to setup your application or retrieve things before you want the Guarantor to start retrieving or initializing values.

#### Wait to Retrieve

This is the default functionality. By passing `option.defer` as a Promise, the Guarantor will not call the `retriever()` until the `option.defer` promise has resolved.

A hypothetical sitation might be when you require authentication (like a `JWT`) before your Guarantor will be able to retrieve anything. In this scenario, you would resolve your `option.defer` promise once you have retrieved your hypothetical `JWT`.

#### Retrieve Now, but Wait to Initialize

**_`boolean`_ `option.retrieveEarly` _Optional_**

This changes the behavior of `option.defer` by calling the `retriever()` immediately, but waiting to `initialize` the values until the `option.defer` promise has resolved.

Setting this to `true` is theoretically faster, because the Guarantor doesn't wait on anything to retrieve the resources and can do so asynchronously while the application sets itself up. But it will only initialize those values once the `parent` promise resolves.


### Advanced/Experimental

#### _`prototype/class`_ `thenableApi` _Optional_

The `thenableApi` feature allows you to specify a Promise implementation other than the built-in, which should give you flexibility in the types of Promises you're working with. For instance, official support for the novel [`thenable-events`](https://www.npmjs.com/package/thenable-events) Promise implementation is expected in the near future.

