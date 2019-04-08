interface RequestProgress {
  loaded: number;
  total: number;
}

interface RequestState<T> {
  status: 'NOT_SEND' | 'LOADING' | 'SUCCESS' | 'FAILED';
  statusCode: number;
  withLoader: boolean;
  progress: RequestProgress;
  data?: T;
  headers?: { [key: string]: string };
  error?: object;
}

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

type FetchPolicy = 'cache-first' | 'network-only';

type XhrBody =
  | string
  | FormData
  | Blob
  | ArrayBufferView
  | ArrayBuffer
  | URLSearchParams
  | ReadableStream
  | Document
  | undefined;

type HttpBody = { [key: string]: any } | XhrBody;

interface RequestParams {
  url: string;
  method?: HttpMethod;
  headers?: { [key: string]: string };
  query?: { [key: string]: string };
  body?: HttpBody;
  responseType?: 'arraybuffer' | 'blob' | 'document' | 'json' | 'text';
}

interface RequestOptions {
  abortOnUnmount?: boolean;
  loaderDelay?: number;
  withProgress?: boolean;
}

export { RequestState, RequestParams, RequestOptions, XhrBody, HttpBody, FetchPolicy };
