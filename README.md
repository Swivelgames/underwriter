# Underwriter

A simple, yet powerful, Promise Registry.

- [How It Works](#how-it-works)
- [Quick Usage](#quick-usage)
  - [Example](#example)
- [Options](#options)
  - [_`function`_ `options.retriever` _Required_](#function-optionsretriever-required)
  - [_`function`_ `options.initializer` _Optional_](#function-optionsinitializer-optional)
  - [_`Promise`_ `option.defer` _Optional_](#promise-optiondefer-optional)
    - [Wait to Retrieve](#wait-to-retrieve)
    - [Retrieve Now, But Wait to Initialize](#retrieve-now-but-wait-to-initialize)
  - [Advanced/Experimental](#advancedexperimental)
    - [_`prototype/class`_ `options.thenableApi` _Experimental_](#-prototypeclass-optionsthenableapi-experimental)
    - [_`boolean`_ `options.publicFulfill` _Experimental_](#-boolean-optionspublicfulfill-experimental)
- [Test Coverage](#test-coverage)
- [Lifecycle Diagram](#lifecycle-diagram)

## How It Works

Underwriter provides access to Guarantors, which are simple interfaces for
retrieving Promises by name. These promises can either be Resolved with a
`guarantee` or Rejected with an error.

1. A Guarantor is basically an object that holds Promises
2. Each Promise (guarantee) has a name (identifier)
3. When you call `.get(identifier)`, you get a Promise back, and the
`retriever()` is called
4. Once `retriever()` fetches the value, an optional `initializer()` can be used
to parse/initialize the value
5. Once that is complete, the value is given to anyone who calls `.get(identifier)`

In more ambiguous terms (`:^)`), Underwriter uses `Guarantors` to provide
consumers with a method of retrieving named `guarantees` from its registries.

Guarantors are general purpose, and can be used for anything, from
asynchronously importing ESM modules using `import()`, one-time retrieval of
static resources from an API/CDN/wherever, or anything else you can think of. It
can even be used for retrieving interfaces for things already loaded in your
environment, like UI Components, Controllers, Models, Stores, Actions, et cetera.

## Quick Usage

```javascript
import Guarantor from "underwriter";
const options = { retriever: (identifier) => fetchSomething(identifier) };
const guarantor = new Guarantor(options);
const resource = await guarantor.get(identifier);
```

1. Create a Guarantor (registry)
2. Supply a `retriever(identifier: string): Promise<guarantee>`
3. Request a `guarantee` with `Guarantor.get(identifier)`

### Example

#### Remote Resource

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

#### Guarantor

```javascript
import Guarantor from "underwriter";

const retriever = (identifier) => (
        fetch(`/configs/${identifier}.json`).then(
                (response) => response.json()
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

## Options

### _`function`_ `options.retriever` _Required_

TypeScript notation:

```typescript
type retriever = (identifier: string): Promise<any>;
```

The `retriever()` can be any function that accepts an `identifier` and resolves
with a promise once the `guarantee` has been retrieved.
The `retriever` option is a function that is called whenever `.get(identifier)`
is called. It is given an `identifier` and expected to retrieve the resource and
return it in the form of a promise. This may take the form of a Fetch/XHR/AJAX
request, an `import()`, or as simply mapping the `identifier` to the `key` of
an object.

For those that prefer TypeScript-like notation, the `retriever()` should follow
something like:

### _`function`_ `options.initializer` _Optional_

TypeScript notation:

```typescript
type initializer = (identifier: string, guarantee: any): any;
```

The `initializer` is given the `identifier` and `guarantee` value after the
resource is retrieved. It's role is to prepare the value for usage. Whatever
it returns will be the value that is given to anyone who has requested this
guarantee with `.get(identifier)`. This could conceivably be a santization
function, a function that calls `JSON.parse()` on the input, or constructs a
new class based on the data (e.g., `(id, guarantee) => new Foobar(guarantee)`).

### _`Promise`_ `option.defer` _Optional_

If you need a Guarantor to wait before it `retrieves` or `initializes` your
guarantees, you can use the `defer` option, which takes a Promise (or any
Thenable), and waits for it to resolve before continuing. This can be useful
if you need to setup your application or retrieve things before you want the
Guarantor to start retrieving or initializing values.

#### Wait to Retrieve

This is the default functionality. By passing `option.defer` as a Promise, the
Guarantor will not call the `retriever()` until the `option.defer` promise has
resolved.

```javascript
const defer = startupProcess(); // Promise
const guarantor = new Guarantor({ retriever, defer });
// Won't retrieve until startupProcess is resolved
const foobar = await guarantor.get('foobar');
```

A hypothetical sitation might be when you require authentication (like a `JWT`)
before your Guarantor will be able to retrieve anything. In this scenario, you
would resolve your `option.defer` promise once you have retrieved your
hypothetical `JWT`.

#### Retrieve Now, But Wait to Initialize

**_`boolean`_ `option.retrieveEarly` _Optional_**

This changes the behavior of `option.defer` by allowing the Guarantor to call
the `retriever()` immediately, but defers the call to the `initializer()`
until the `option.defer` promise has resolved.

```javascript
const defer = startupProcess(); // Promise
const guarantor = new Guarantor({
        retriever,
        retrieveEarly: true, /* <<< */
        initializer,
        defer,
});
// Retrieves immediately, but doesn't initialize() or
// resolve until after startupProcess is resolved
const foobar = await guarantor.get('foobar');
```

Setting this to `true` is theoretically faster, because the Guarantor doesn't
wait on anything to retrieve the resources and can do so asynchronously while
the application sets itself up. But it will only initialize those values once
the `parent` promise resolves.

### Advanced/Experimental

#### 🧪 _`prototype/class`_ `options.thenableApi` _Experimental_

The `options.thenableApi` feature allows you to specify a Promise
implementation different than the built-in, which should give you flexibility
in the types of Promises you're working with. For instance, official support
for the novel [`thenable-events`](https://www.npmjs.com/package/thenable-events)
Promise implementation is expected in the near future.

#### 🧪 _`boolean`_ `options.publicFulfill` _Experimental_

By default, a `retriever` will execute when a Guarantee is requested, and the
return value of this `retriever` will be used to `initialize` and then `fulfill`
the Guarantee. However, if there are times when you would like to `fulfill` a
Guarantee outside of the standard lifecycle, you can do so by setting
`publicFulfill` to `true`, which will give you a method for fulfilling a
Guarantee ad-hoc:

```typescript
type Guarantor.fulfill = (identifier: string, guarantee: any): Promise<any>;
```

Executing this function will pass the `identifier` and `guarantee` to the
optional `initializer`, and then fulfill the Guarantee.

> **Note:** _Guarantees can only be fulfilled once. Attempting to fulfill a
> Guarantee outside of the standard lifecycle may cause a rejection if the
> Guarantee has already been fulfilled._

| :warning: This may change behavior in an unexpected manner. |
| --- |

Please be aware of the differences in behavior outlined below before using this
option.

| `publicFulfill` | Changes |
| -------------- | :------ |
| `true`         | <ul><li>A previously non-existent `Guarantor.fulfill()` method appears.</li><li>The `retriever` option becomes optional.</li><li>If the `retriever()` returns `undefined` for a particular identifier, the guarantee _will not be fulfilled with a value of `undefined`_, and instead wait for the manual invocation of `Guarantor.fulfill()` to fulfill the promise (see fulfill syntax above).</li></ul> |
| `false`        | <ul><li>If `options.publicFulfill = false`, a warning is now outputted informing the developer that **_the guarantee will successfully be fulfilled with a value of `undefined`_**, which may be unintended.</li></ul> |

This behavior is currently being debated. Please refer to the issue ticket, or
create one, to discuss.

## Test Coverage

```mocha
  underwriter::Guarantor
    underwriter::constructor()
      ✔ should throw if no retriever is passed
      ✔ should NOT throw if optional properties are omitted from options
      ✔ should throw if an invalid retriever is passed
      ✔ should throw if an invalid defer is passed
      ✔ should throw if an invalid initializer is passed
      ✔ should throw if an invalid Thenable API is passed
      ✔ should NOT expose a fulfill method if publicFulfill option is omitted
      ✔ should NOT expose a fulfill method if publicFulfill option is false
      ✔ should expose a fulfill method if publicFulfill option is true
      ✔ should NOT throw if publicFulfill is true and no retriever is passed
    underwriter:get( identifier )
      ✔ should reject if no identifier is passed
      ✔ should reject if an invalid identifier is passed
      ✔ should reject if the retriever fails
      ✔ should create a promise and call the retriever
      ✔ should not produce new promises or call the retriever again on subsequent calls
      ✔ should wait to retrieve a guarantee until defer promise resolves if retrieveEarly is false
      ✔ should immediately retrieve a guarantee if retrieveEarly is true
      ✔ should fulfill even if retriever returns void
      ✔ should NOT fulfill if retriever returns void, but publicFulfill is true
      ✔ should not call the retriever if it was omitted and publicFulfill is true
    underwriter:fulfill( identifier, guarantee )
      ✔ should fulfill the guarantee matching the identifier

  underwriter::utils
    formatName()
      ✔ should return lowercased version of a string
      ✔ should cast other types to string
    initializeIfNeeded()
      ✔ should initialize a missing key
      ✔ should initialize a missing key with a specific value factory
      ✔ should preserve the original value if a key already exists


  30 passing (98ms)

--------------|---------|----------|---------|---------|-------------------
File          | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
--------------|---------|----------|---------|---------|-------------------
All files     |     100 |      100 |     100 |     100 |
 copy.js      |     100 |      100 |     100 |     100 |
 fulfill.js   |     100 |      100 |     100 |     100 |
 guarantor.js |     100 |      100 |     100 |     100 |
 utils.js     |     100 |      100 |     100 |     100 |
--------------|---------|----------|---------|---------|-------------------
```

## Lifecycle Diagram

Here's a bonus for you: A horribly crude and probably unhelpful lifecycle
diagram that looks like it was put together by a 5 year old :)

```diagram
call  ╔═════════════════════╗      ┌┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┐
⇢┈┈⇢┈ ║ Guarantor.get( id ) ║      ┊  (some local or remote resource)  ┊
      ╚══════════╤══════════╝      └┈┈┈┈┈┈┈┬┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┬┈┈┈┈┈┈┈┘
                 │                         │                   │
                 │              ┌──────────↑───────────────────↓───────┐
                 │          (pending)      ↑                   │       │
 return    ╔═══════════╗⇢┈┈┈┈⇢┈ │── options.retriever(id)      │       │
⇠┈┈┈┈┈┈┈┈⇠ ║ *Promise  ║        │                              ↓       │
           ╚═══════════╝┈⇠┈┈┈┈⇠ │←─ options.intializer(id, resource)   │
                           (fulfilled)                                 │
                                └──────────────────────────────────────┘
```
