# loti-request
A new component to make declarative request with react

> ℹ️ Since version v0.4.0 loti-request use react hooks, so react >= 16.8.0 is required

> ️️ℹ️ After a few months using this lib on projects I didn't need to make breaking change since v0.2.0 so the api shouldn't change a lot in the future.

> In version v0.4.0 `MultiFetch` component is removed, the goal of this component was to avoid nested `Fetch` components to get several ressources in a component. Thanks to react hooks, we haven't anymore this problem so `MultiFetch` become useless.

## Install

```bash
yarn add loti-request

# or with npm

npm install --save loti-request
```

## Motivation

After using [Apollo client](https://github.com/apollographql/apollo-client), I find amazing to get server data declaratively. The goal of this library is to give a similar way to make http request on REST api.
Even if there are other librairies doing that I want to bring some new ideas about api and some features like :
- abort request on unmount
- upload progress status

## Plan for futur
- [x] option to select fetch policy (use cache or not)
- [x] create hooks for next version of react
- add upload progress
- possibility to use custom cache
- ~~improve MultiFetch component to make possible have requests with different response types~~

## Basic examples

#### fetch one ressource
```jsx
import { useFetch } from 'loti-request';

...

const MyComponent = () => {
  const { status, data } = useFetch({ url: 'http://localhost:3000/posts/1' });

  switch (status) {
    case 'LOADING':
      return 'Loading request';
    case 'FAILED':
      return 'Request failed';
    case 'SUCCESS':
      return <div>Request SUCCESS 🎉 {data.title}</div>;
  }
}
```

or with render prop

```jsx
import { Fetch } from 'loti-request';

...

<Fetch
  url={`http://localhost:3000/posts/1`}
>
  {({ status, data }) => {
    switch (status) {
      case 'LOADING':
        return 'Loading request';
      case 'FAILED':
        return 'Request failed';
      case 'SUCCESS':
        return <div>Request SUCCESS 🎉 {data.title}</div>;
    }
  }}
</Fetch>
```

#### submit form
```jsx
import { useRequest } from 'loti-request';

...

const MyComponent = () => {
  const { status, fetch } = useRequest({
    url: 'http://localhost:3000/posts',
    method: 'POST',
    onSuccess: () => console.log('Submit Succeed'),
    onError: () => console.log('Submit Failed'),
  });

  return (
    <Fragment>
      <button onClick={() => fetch()} disabled={status === 'LOADING'}>
        {status === 'LOADING' ? 'Loading' : 'Submit'}
      </button>
      {status === 'FAILED' && <span>Submit Failed</span>}
    </Fragment>
  );
}
```

or with render prop

```jsx
import { Request } from 'loti-request';

...

<Request
  url="http://localhost:3000/posts"
  method="POST"
  onSuccess={() => console.log('Submit Succeed')}
  onError={() => console.log('Submit Failed')}
>
  {({ status, fetch }) => (
    <Fragment>
      <button onClick={() => fetch()} disabled={status === 'LOADING'}>
        {status === 'LOADING' ? 'Loading' : 'Submit'}
      </button>
      {status === 'FAILED' && <span>Submit Failed</span>}
    </Fragment>
  )}
</Request>
```

## Documentation

### RequestProvider
In some case you need to set similar headers in all your request for authentification for example.
To avoid set those headers in props of each `Fetch` or `Request` component, you can wrap your app with `RequestProvider`. All `Fetch` and `Request` components will automatically use headers set in `RequestProvider` props.
If you set `headers` props in `Fetch` or `Request` component, headers will be merge and similar keys will be overwrite.

#### Props :
**headers** `object`  
headers to apply on each `Fetch` and `Request` components

#### Exemple :
```jsx
import { RequestProvider } from 'loti-request'

...

<RequestProvider headers={{ authorization: 'abcdef' }}>
  <App />
</RequestProvider>
```

### useFetch hook
This hook will automatically fetch data on mount and on props change.
On unmount the request will be aborted if it's loading.
If request has already be called, the response is get from cache instead of a http request.

### Options :
- **url** `string`  
url to call.

- **method** `(optional, default 'GET') 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'`  
Http method to use.

- **headers** `(optional) object`  
Http headers.

- **query** `(optional) object`  
Request url query.

- **body** `(optional) object | string | FormData | Blob`  
Request body.

- **loaderDelay** `(optional) number`  
delay (in milliseconds) before children param `requestState.timeoutReached` become true when request is loading. Can be usefull if you want display a loader after a delay.

- **abortOnUnmount** `(optional, default true) boolean`  
define if request should be abort when component is unmounted.  
if the value is false, onSuccess and onError callbacks will be called even if component is unmounted.

- **withProgress** `(optional) boolean`  
by activate this prop, you can access to download progress when request is loading (in `requestState.loaded` and `requestState.total`).

- **responseType** `(optional, default 'json') 'arraybuffer' | 'blob' | 'document' | 'json' | 'text'`  
the type of response expected.

- **onSuccess** `(optional) function (data: T, params: RequestParams): void`  
callback when request succeed, can be usefull to display a success message.
`T` is a generic type depending on response type.  
`params` are request parameters used by `fetch` call, the list of parameters are listed in `useFetch` options documentation.

- **onError** `(optional) function (response: any, statusCode: number, params: RequestParams): void`  
callback when request failed, can be usefull to display an error message.  
`params` are request parameters used by `fetch` call, the list of parameters are listed in `useFetch` options documentation.
> `statusCode` param was added in v0.5.0

### Returned values :
- **status** `'LOADING' | 'FAILED' | 'SUCCESS'`  
request status.

- **withLoader** `boolean`  
true when request duration exceed `loaderDelay` prop

- **progress** `{ loaded: number, total: number }`  
quantity of bytes downloaded and total to download (works only when `withProgress` is true)

- **data** `T | undefined`  
response data. `T` is a generic type depending on response type.

- **headers** `object | undefined`  
response headers.

- **error** `any`  
the error thrown by request if status isn't between 200 and 299 or a runtime error if response type doesn't correspond with http response.

- **refetch** `function (): void`  
a function to recall request. Can be usefull to retry a request or to reload data after a specific event.

### Fetch component
If you prefer render prop over hooks, you can use the `Fetch` component.
Props of this component are exactly the same as `useFetch` options.
The expected children of `Fetch` is a function with values returned by `useFetch` hook.

### useRequest hook
If you want to fetch data only after a click on a button or if you want to send form data after submit, you can use `useRequest` hook.
No request is send on mount, request is send only after call of `fetch` function available in returned values (see in example above).
If parent component is unmount during loading, the request will be aborted.

### Options :
- **url** `(optional) string`  
url to call.

- **method** `(optional default 'GET') 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'`  
Http method to use.

- **headers** `(optional) object`  
Http headers.

- **query** `(optional) object`  
Request url query.

- **body** `(optional) object | string | FormData | Blob`  
Request body.

- **loaderDelay** `(optional) number`  
delay before children param `requestState.timeoutReached` become true when request is loading. Can be usefull if you want display a loader after a delay.

- **abortOnUnmount** `(optional, default true) boolean`  
define if request should be abort when component is unmounted.  
if the value is false, onSuccess and onError callbacks will be called even if component is unmounted.

- **withProgress** `(optional) boolean`  
by activate this prop, you can access to download progress when request is loading (in `requestState.loaded` and `requestState.total`).

- **responseType** `(optional, default to 'json') 'arraybuffer' | 'blob' | 'document' | 'json' | 'text'`  
the type of response expected.

- **onSuccess** `(optional) function (data: T, params: RequestParams): void`  
callback when request succeed, can be usefull to display a success message.
`T` is a generic type depending on response type.  
`params` are request parameters used by `fetch` call, the list of parameters are listed in `fetch` prop documentation.

- **onError** `(optional) function (response: any, statusCode: number, params: RequestParams): void`  
callback when request failed, can be usefull to display an error message.  
`params` are request parameters used by `fetch` call, the list of parameters are listed in `fetch` prop documentation.
> `statusCode` param was added in v0.5.0

### Returned values :
- **fetch** `function (params: RequestParams): void` the function which make http request. `params` are :
  - **url** `(optional) string` url to call.

  - **method** `(optional) 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'` Http method to use.

  - **headers** `(optional) object`  
Http headers.

  - **query** `(optional) object`  
Request url query.

  - **body** `(optional) object | string | FormData | Blob` Request body.

> params use in `fetch` are merge with options, so you can choose to set some params in hook options like `method` and set other params like `body` or `query` in `fetch` call.

- **status** `'NOT_SEND', 'LOADING' | 'FAILED' | 'SUCCESS'`  
request status.

- **withLoader** `boolean`  
true when request duration exceed `loaderDelay` prop

- **progress** `{ loaded: number, total: number }`  
quantity of bytes downloaded and total to download (works only when `withProgress` is true)

- **data** `T | undefined`  
response data. `T` is a generic type depending on response type.

- **headers** `object | undefined`  
response headers.

- **error** `any`  
the error thrown by request if status isn't between 200 and 299 or a runtime error if response type doesn't correspond with http response.

### Request component
If you prefer render prop over hooks, you can use the `Request` component.
Props of this component are exactly the same as `useRequest` options.
The expected children of `Request` is a function with values returned by `useRequest` hook.

### Cache functions

Sometimes we need to clean cache after creation or update some data.
You can use `removeCachedRequests` and `resetCache` to remove some request from cache.

#### removeCachedRequests(url: string | RegExp) => void
remove requests which have an url matching with param.
##### Exemple :
```js
import { removeCachedRequests } from 'loti-request'

// remove from cache all requests with a url finishing by `match/:id`
removeCachedRequests(/match\/\d*$/)
```

#### resetCache() => void
remove all requests from cache.
##### Exemple :
```js
import { resetCache } from 'loti-request'

resetCache()
```
