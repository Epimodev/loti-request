# loti-request
A new component to make declarative request with react

## ⚠️ This library is under active development and API may change until version 1

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
- option to select fetch policy (use cache or not)
- add upload progress
- possibility to use custom cache
- improve MultiFetch component to make possible have requests with different response types.

## Basic examples

#### fetch one ressource
```jsx
import { Fetch } from 'loti-request';

...

<Fetch
  url={`http://localhost:3000/posts/1`}
>
  {({ requestState }) => {
    switch (requestState.status) {
      case 'LOADING':
        return 'Loading request';
      case 'FAILED':
        return 'Request failed';
      case 'SUCCESS':
        return <div>Request SUCCESS 🎉 {requestState.data.title}</div>;
    }
  }}
</Fetch>
```

#### fetch several ressources
```jsx
import { MultiFetch } from 'loti-request';

...

<MultiFetch
  requests={{
    posts: {
      url: 'http://localhost:3000/posts',
    },
    comments: {
      url: 'http://localhost:3000/comments',
    },
  }}
>
  {({ requestState }) => {
    switch (requestState.status) {
      case 'LOADING':
        return 'At least one request is loading';
      case 'FAILED':
        return 'At least one request failed';
      case 'SUCCESS':
        // posts are available at `requestState.data.posts`
        // comments are available at `requestState.data.comments`
        return <div>Requests SUCCESS 🎉 </div>;
    }
  }}
</MultiFetch>
```

#### submit form
```jsx
import { Request } from 'loti-request';

...

<Request
  url="http://localhost:3000/posts"
  method="POST"
  onSuccess={() => console.log('Submit Succeed')}
  onError={() => console.log('Submit Failed')}
>
  {({ requestState, fetch }) => (
    <Fragment>
      <button onClick={() => fetch()} disabled={requestState.status === 'LOADING'}>
        {requestState.status === 'LOADING' ? 'Loading' : 'Submit'}
      </button>
      {requestState.status === 'FAILED' && <span>'Submit Failed'</span>}
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

### Fetch component
This component will automatically fetch data on mount and on props change.
On unmount the request will be aborted if it's loading.
If request has already be called, the response is get from cache instead of a http request.

#### Props :
**url** `string`  
url to call.

**method** `(optional, default 'GET') 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'`  
Http method to use.

**headers** `(optional) object`  
Http headers.

**query** `(optional) object`  
Request url query.

**body** `(optional) object | string | FormData | Blob`  
Request body.

**loaderDelay** `(optional) number`  
delay (in milliseconds) before children param `requestState.timeoutReached` become true when request is loading. Can be usefull if you want display a loader after a delay.

**withProgress** `(optional) boolean`  
by activate this prop, you can access to download progress when request is loading (in `requestState.loaded` and `requestState.total`).

**responseType** `(optional, default 'json') 'arraybuffer' | 'blob' | 'document' | 'json' | 'text'`  
the type of response expected.

**onSuccess** `(optional) function (data: T): void`  
callback when request succeed, can be usefull to display a success message.
`T` is a generic type depending on response type

**onError** `(optional) function (error: any): void`  
callback when request failed, can be usefull to display an error message

**children** `function (ChildrenParams): ReactNode`  
params given by children function are :
- **refetch** `function (): void` a function to recall request. Can be usefull to retry a request or to reload data after a specific event.
- **requestState**, which contain request status and data.

When `requestState.status === 'LOADING'` requestState contain the following properties :
  - **timeoutReached** `boolean`: true when request duration exceed `loaderDelay`
  - **loaded** `number` quantity of bytes downloaded (works only when `withProgress` is true)
  - **total** `number` quantity of bytes to download (works only when `withProgress` is true)
  - **data** `T (available only when we use refetch)` data of previous response when we use `refetch`

When `requestState.status === 'SUCCESS'` requestState contain the following property :
  - **data** `T` response data. `T` is a generic type depending on response type.

When `requestState.status === 'ERROR'` requestState contain the following property :
  - **error** `any` the error thrown by request if status isn't between 200 and 299 or a runtime error if response type doesn't corrspond with http response.


### MultiFetch component
Maybe you'll need to fetch several endpoints for a component. Instead to use several `Fetch` component, you can use `MultiFetch` which will work like `Fetch` component but enable the possibility to set several requests in props.
Already loaded requests will be get from cache.
On unmount loading requests will be aborted.

#### Props :
**requests** `object`
the list of request to make. each key can take those params :
- **url** `string`  
url to call.

- **method** `(optional) 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'`  
Http method to use.

- **headers** `(optional) object`  
Http headers.

- **query** `(optional) object`  
Request url query.

- **body** `(optional) object | string | FormData | Blob`  
Request body.

**loaderDelay** `(optional) number`  
delay before children param `requestState.timeoutReached` become true when request is loading. Can be usefull if you want display a loader after a delay.

**onSuccess** `(optional) function (data: T): void`  
callback when request succeed, can be usefull to display a success message.
`T` is a generic type depending on response type

**onError** `(optional) function (error: any): void`  
callback when request failed, can be usefull to display an error message

**children** `function (ChildrenParams): ReactNode`  
params available in children function are :
- **refetch** `function (): void` a function to recall request. Can be usefull to retry a request or to reload data after a specific event.
- **requestState**, which contain request status and data.
> the schema of `data` correspond with `requests` props schema. For example if in `requests` there is a request in key `post`, the response of this request will be in `data.post`.


### Request component
If you want to fetch data only after a click on a button or if you want to send form data after submit, you can use `Request` component.
No request are made on mount, request is made only after call of `fetch` function available in children param (see in example above).
If `Request` component is unmount during loading, the request will be aborted.

#### Props :
**url** `(optional) string`  
url to call.

**method** `(optional default 'GET') 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'`  
Http method to use.

**headers** `(optional) object`  
Http headers.

**query** `(optional) object`  
Request url query.

**body** `(optional) object | string | FormData | Blob`  
Request body.

**loaderDelay** `(optional) number`  
delay before children param `requestState.timeoutReached` become true when request is loading. Can be usefull if you want display a loader after a delay.

**withProgress** `(optional) boolean`  
by activate this prop, you can access to download progress when request is loading (in `requestState.loaded` and `requestState.total`).

**responseType** `(optional, default to 'json') 'arraybuffer' | 'blob' | 'document' | 'json' | 'text'`  
the type of response expected.

**onSuccess** `(optional) function (data: T): void`  
callback when request succeed, can be usefull to display a success message.
`T` is a generic type depending on response type

**onError** `(optional) function (error: any): void`  
callback when request failed, can be usefull to display an error message

**children** `function (ChildrenParams): ReactNode`  
params available in children function are :
- **fetch** `function (params: RequestParams): void` the function which make http request. `params` are :
  - **url** `(optional) string` url to call.

  - **method** `(optional) 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'` Http method to use.

  - **headers** `(optional) object`  
Http headers.

  - **query** `(optional) object`  
Request url query.

  - **body** `(optional) object | string | FormData | Blob` Request body.

> params use in `fetch` are merge with props, so you can choose to set some params in component props like `method` and set other params like `body` or `query` in `fetch` call.

- **requestState**, which contain request status and data.

When `requestState.status === 'NOT_SEND'` requestState doesn't contain other property.

When `requestState.status === 'LOADING'` requestState contain the following properties :
  - **timeoutReached** `boolean`: true when request duration exceed `loaderDelay`
  - **loaded** `number` quantity of bytes downloaded (works only when `withProgress` is true)
  - **total** `number` quantity of bytes to download (works only when `withProgress` is true)
  - **data** `T (available only when we use refetch)` data of previous response when we use `refetch`

When `requestState.status === 'SUCCESS'` requestState contain the following property :
  - **data** `T` response data. `T` is a generic type depending on response type.

When `requestState.status === 'ERROR'` requestState contain the following property :
  - **error** `any` the error thrown by request if status isn't between 200 and 299 or a runtime error if response type doesn't corrspond with http response.
