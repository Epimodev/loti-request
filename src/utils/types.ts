type NotSend = {
  status: 'NOT_SEND';
};

type Failed = {
  status: 'FAILED';
  error: any;
};

type Loading<T> = {
  status: 'LOADING';
  timeoutReached: boolean;
  loaded: number;
  total: number;
  data?: T;
};

type Success<T> = {
  status: 'SUCCESS';
  data: T;
};

type FetchState<T> = Failed | Loading<T> | Success<T>;

type RequestState<T> = NotSend | Failed | Loading<T> | Success<T>;

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

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

interface FetchParams {
  url: string;
  method?: HttpMethod;
  headers?: { [key: string]: string };
  query?: { [key: string]: string };
  body?: HttpBody;
}

interface RequestOptions {
  loaderDelay?: number;
  withProgress?: boolean;
  responseType?: 'arraybuffer' | 'blob' | 'document' | 'json' | 'text';
}

export { FetchState, RequestState, FetchParams, RequestOptions, XhrBody, HttpBody };
