# Underwriter

A simple, yet powerful, Promise Registry.


# How It Works

Underwriter provides access to Guarantors, which are simple interfaces for retrieving named Promises. These promises can either be Resolved with a `guarantee` or Rejected with an error.

In more ambiguous terms (`:^)`), Underwriter uses `Guarantors` to provide consumers with a method of retrieving named `guarantees` from its registries.


## Quick Usage

1. Create a Guarantor (registry)
2. Supply a `retriever(identifier: string): Promise<any>`
3. Request a `guarantee` with `Guarantor.get(identifier)`

```javascript
import Guarantor from "underwriter";

const retriever = (identifier) => (
	get(`/api/some_resource/${identifier}`)
);

const guarantor = new Guarantor({ retriever });

const foobar = await guarantor.get('foobar');
```


## Lifecycle

### Creating a Guarantor

`Guarantor` provides the Promise registry. On instantiation, it is given a `retriever()` function, which is used to locate and retrieve a Guarantee that is being requested.

```javascript
const guarantor = new Guarantor({
	retriever: (identifier) => (
		import(`/scripts/${identifier}.jsm`);
	)
});
```


### Retriever

The `retriever()` can be any function that accepts an `identifier` and resolves with a promise once the `guarantee` has been retrieved.

For those that prefer TypeScript-like notation, the `retriever()` should follow something like:
```typescript
type retriever = (identifier: string): Promise<any>;
```

The `retriever()` can be used for doing anything from importing ESM modules using `import()`, one-time retrieval of static resources from an API/CDN/wherever, or anything else you can think of. It can even be used for retrieving interfaces for things already loaded in your environment, like UI Components, Controllers, Models, Stores, Actions, et cetera.


### Retrieving a Guarantee

Retrieving a `guarantee` is as simple as calling `.get()` on the Guarantor instance with the `identifier` that matches your intended resource.

```javascript
await guarantor.get('my-component');
```


### Multiple Retrievers or Initializers for Different Types of Values

If you have multiple different types of resources that you want to be able to retrieve with a Guarantor, it is common to have multiple Guarantors designed specifically for retrieving specific types of resources. This gives you separation and alleviates the need to have a single, complex `retriever()` function. Instead, you can have a `retriever()` for each different type that you want access to.

Conceptually, it's even conceivable to create a simple interface in front of your Guarantors for getting guarantees of a particular type from a particular Guarantor. (e.g., `myCustomInterface.get("components", "my-component")` and `myCustomInterface.get("stores", "my-store")`.)


## Nifty Features

### Initializers

If you need to process your data further after its been retrieved, it's recommended to use an `initializer()`, rather than to clutter your `retriever()` with that logic.

The `initializer()` should be a function that expects an `identifier` and its `guarantee`. By the end of it, whatever the `initializer()` returns will be used to fulfill the promise.

```javascript
// Simple retriever
const retriever = (identifier) => getMyStuff(identifier);

// Initializer that might sanitize the guarantee before fulfilling the promise
const initializer = (identifier, theStuffWeGotBack) => {
	const finalValue = JSON.parse(
		theStuffWeGotBack
	);
	return finalValue;
};

// Then we pass the retriever and initializer to the constructor
const guarantor = new Guarantor({ retriever, initializer });

// The foobar variable will now contain the JSON parsed version of the guarantee
const foobar = await guarantor.get('foobar');
```


### Parent Promise

You don't have to wait for everything in your application to be initialized before creating and giving access to Guarantor instances. Instead, you can pass a Promise in the `parent` option to defer retrieving or initializing values until after it resolves.

This option can be further configured based on the `retrieveEarly` option. If `retrieveEarly` is set to `true`, then `guarantees` will be immediately requested, but the `initializer` will not be called until the `parent` promise is resolved.


##### With `retrieveEarly = false` (_default_)
```javascript
// Pass the parent promise into the constructor as an option
const guarantor = new Guarantor({ retriever, initializer, parent });

// The guarantee will not be retrieved or initialized
// until after the `parent` promise has been resolved.
const foobar = await guarantor.get('foobar');
```


##### With `retrieveEarly = true`
```javascript
// Pass the parent promise into the constructor as an option
const guarantor = new Guarantor({
	retriever,
	initializer,
	parent,
	retrieveEarly: true
});

// The retriever will be called immediately, even
// before the `parent` promise has been resolved.
// But `initializer` will wait for `parent`.
const foobar = await guarantor.get('foobar');
```


## Reference

### Terms

- `Guarantor`: Registry that provides an interface for asynchronously requesting `guarantees`.
- `identifier`: A string containing the name of a `guarantee`.
- `guarantee`: Any value that is intended to be retrieved.
- `retriever`: A function used to retrieve a `guarantee`.
- `initializer`: A function used to sanitize or initialize a `guarantee` before its promise is resolved.
- `parent`: A promise used to defer the retrieval or initialization of a guarantee until after it resolves.


### Lifecycle Overview

- A `Guarantor` is created with a `retriever()` function, and optionally an `initializer()`.
- At any point after the Guarantor is created, a `guarantee` can be requested using `.get(identifier)`.
- When `.get(identifier)` is called, a Promise is generated for that `guarantee` and returned.
- If `.get(identifier)` is called again with the same `identifier`, it will return the same promise.
- The promise for the `guarantee` will be fulfilled when the `retriever()` and `initializer()` resolve successfully.
- If the `parent` option is a Promise, the Guarantor will defer retrieving or initializing a `guarantee` until that promise is resolved. The behavior is dictated by the `retrieveEarly` option.
    - If the `retrieveEarly` option is `false` (default), the Guarantor will defer calling the `retriever()` until `parent` is fulfilled.
    - If the `retrieveEarly` option is `true`, the Guarantor will call `retriever()` immediately when `.get(identifier)` is called, but will wait to call the `initializer()` until `parent` is fulfilled.


### module `"underwriter"`
```javascript
import Guarantor from "underwriter"
```

**Exports:**

 - **default**: See Guarantor


### class `new Guarantor(options)`
```javascript
new Guarantor(options = {
	parent: Promise,
	retriever: function,
	initializer: function,
	retrieveEarly: boolean,
	thenableApi: thenable,
})
```

#### Options

##### retriever `(identifier: string) => Promise<any>`: Required

The `retriever` option is a function that is called whenever `.get(identifier)` is called. It is given an `identifier` and expected to retrieve the resource and return in it in the form of a promise. This may take the form of a Fetch/XHR/AJAX request, an `import()`, or as simply mapping the `identifier` to the `key` of an object.


##### initializer `(identifier: string, guarantee: any) => guarantee`: _Optional_

The `initializer` is given the `identifier` and `guarantee` value after the resource is retrieved. It's role is to prepare the value for usage. Whatever it returns will be the value that is given to anyone who has requested this guarantee with `.get(identifier)`. This could conceivably be a santization function, a function that calls `JSON.parse()` on the input, or constructs a new class based on the data (e.g., `(id, guarantee) => new Foobar(guarantee)`).


##### parent `instanceof Promise | has .then()`: _Optional_

The `parent` option should be an instance of a `thenable`. It is used to defer the retrieval or initialization of a guarantee until after it has been resolved. This is useful if you need to setup your application first, or have other things that you need to pull into your application, before your Guarantor can start retrieving or initializing resources.

Behavior is configurable with `retrieveEarly`. (See below).


##### retrieveEarly `true | false`: _Default: false_

By default, the `parent` will defer retrieving a guarantee until it has been resolved. However, if `retrieveEarly` is set to `true`, then the `parent` promise will only defer calling the `initializer`. This is useful in case you have nothing preventing you from retrieving a resource, but need to wait on setup in order to be able to initialize your resource.

Setting this to `true` is theoretically faster, because the Guarantor doesn't wait on anything to retrieve the resources and can do so asynchronously while the application sets itself up. But it will only initialize those values once the `parent` promise resolves.

However, as an example, in a hypothetical sitation where you require a `JWT` to be retrieved and stored before your Guarantor will be able to retrieve anything, setting this to `false` is recommended. In this scenario, you would resolve your `parent` promise once you have retrieved your `JWT`. There are many other scenarios where this might be useful.


##### thenableApi `thenable`

The `thenableApi` feature allows you to specify a Promise implementation other than the built-in, which should give you flexibility in the types of Promises you're working with. For instance, official support for the novel [`thenable-events`](https://www.npmjs.com/package/thenable-events) Promise implementation is expected in the near future.


