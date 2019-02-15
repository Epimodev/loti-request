import { stringify } from 'query-string';
import * as swallowEquals from 'shallow-equal/objects';
import { RequestParams, RequestOptions, RequestState, HttpBody, XhrBody } from './types';

function areParamsEquals(paramA?: object, paramB?: object) {
  if (paramA && paramB) {
    return swallowEquals(paramA, paramB);
  }
  return !!paramA === !!paramB;
}

function areBodyEquals(bodyA?: HttpBody, bodyB?: HttpBody) {
  if (typeof bodyA === 'object' && typeof bodyB === 'object') {
    return swallowEquals(bodyA, bodyB);
  }
  return bodyA === bodyB;
}

function areRequestParamsEquals(paramsA: RequestParams, paramsB: RequestParams): boolean {
  if (paramsA === paramsB) {
    return true;
  }
  return (
    paramsA.url === paramsB.url &&
    paramsA.method === paramsB.method &&
    areParamsEquals(paramsA.query, paramsB.query) &&
    areBodyEquals(paramsA.body, paramsB.body) &&
    areParamsEquals(paramsA.headers, paramsB.headers)
  );
}

function isRequestOk({ status }: XMLHttpRequest) {
  return status >= 200 && status <= 299;
}

function formatBody(body?: HttpBody): XhrBody {
  if (body && body.toString() === '[object Object]') {
    // handle case { [key: string]: any } which is not supported by xhr.send
    return JSON.stringify(body);
  }
  return body as XhrBody;
}

function setHeaders(headers: { [key: string]: string } | undefined, xhr: XMLHttpRequest) {
  if (headers) {
    Object.keys(headers).forEach(key => xhr.setRequestHeader(key, headers[key]));
  }
}

function createRequestState(): RequestState<any> {
  return {
    status: 'NOT_SEND',
    progress: {
      loaded: 0,
      total: 1,
    },
    withLoader: false,
  };
}

class XhrRequest<T> {
  private xhr: XMLHttpRequest;
  private options: RequestOptions;
  // each success callbacks is called only once (usefull to call after component unmount)
  private onSuccessCallbacks: ((response: T, params: RequestParams) => void)[] = [];
  // each error callbacks is called only once (usefull to call after component unmount)
  private onErrorCallbacks: ((response: object, params: RequestParams) => void)[] = [];
  private onStateChangeListeners: ((newState: RequestState<T>) => void)[] = [];
  params: RequestParams;
  state: RequestState<T> = createRequestState();
  onAbort?: () => void;

  constructor(fetchParams: RequestParams, requestOptions: RequestOptions) {
    this.xhr = new XMLHttpRequest();
    this.params = fetchParams;
    this.options = requestOptions;
  }

  fetch() {
    const { url, method = 'GET', headers, query, body, responseType = 'json' } = this.params;
    const { loaderDelay = 0, withProgress = false } = this.options;

    // if there isn't loader delay, we update request state once
    if (!loaderDelay) {
      this.setRequestState({ status: 'LOADING', withLoader: true });
    } else {
      this.setRequestState({ status: 'LOADING' });
      setTimeout(() => {
        if (this.state.status === 'LOADING') {
          this.setRequestState({ withLoader: true });
        }
      }, loaderDelay);
    }

    const urlToCall = query ? `${url}?${stringify(query)}` : url;
    this.xhr.responseType = responseType;

    this.xhr.onload = () => {
      if (isRequestOk(this.xhr)) {
        this.handleSuccess(this.xhr.response);
      } else {
        this.handleError(this.xhr.response);
      }
    };

    this.xhr.onerror = () => {
      this.handleError(this.xhr.statusText);
    };

    if (withProgress) {
      this.xhr.onprogress = ({ loaded, total }: ProgressEvent) => {
        this.handleProgress(loaded, total);
      };
    }

    this.xhr.open(method, urlToCall);
    setHeaders(headers, this.xhr);
    this.xhr.send(formatBody(body));
  }

  refetch() {
    this.xhr = new XMLHttpRequest();
    this.fetch();
  }

  private setRequestState(newState: Partial<RequestState<T>>) {
    this.state = { ...this.state, ...newState };
    this.onStateChangeListeners.forEach(onStateChange => onStateChange(this.state));
  }

  private handleProgress(loaded: number, total: number) {
    const progress = { loaded, total };
    this.setRequestState({ progress });
  }

  private handleSuccess(response: T) {
    while (this.onSuccessCallbacks.length > 0) {
      const successCallback = this.onSuccessCallbacks.shift();
      successCallback!(response, this.params);
    }
    this.setRequestState({
      status: 'SUCCESS',
      data: response,
      withLoader: false,
      error: undefined,
    });
  }

  private handleError(error: any) {
    while (this.onErrorCallbacks.length > 0) {
      const errorCallback = this.onErrorCallbacks.shift();
      errorCallback!(error, this.params);
    }
    this.setRequestState({ status: 'FAILED', error, withLoader: false });
  }

  hasSameParams(params: RequestParams): boolean {
    return areRequestParamsEquals(this.params, params);
  }

  addSuccessCallbacks(callback: (response: T, params: RequestParams) => void) {
    this.onSuccessCallbacks.push(callback);
  }

  addErrorCallbacks(callback: (response: object, params: RequestParams) => void) {
    this.onErrorCallbacks.push(callback);
  }

  addStateListener(callback: (newState: RequestState<T>) => void) {
    this.onStateChangeListeners.push(callback);
  }

  removeStateListener(callback: (newState: RequestState<T>) => void) {
    const { abortOnUnmount = true } = this.options;
    const listenerIndex = this.onStateChangeListeners.indexOf(callback);

    if (listenerIndex >= 0) {
      this.onStateChangeListeners.splice(listenerIndex, 1);
      if (
        abortOnUnmount &&
        this.onStateChangeListeners.length === 0 &&
        this.state.status === 'LOADING'
      ) {
        this.xhr.abort();
        this.setRequestState({ status: 'NOT_SEND', withLoader: false });
        if (this.onAbort) {
          this.onAbort();
        }
      }
    } else {
      console.warn('loti-request : Error in removeStateListener `callback` not found');
    }
  }

  updateOptions(options: RequestOptions) {
    // in case request is get from cache for a new component which has `abortOnUnmount` disabled
    if (this.options.abortOnUnmount && !options.abortOnUnmount) {
      this.options.abortOnUnmount = options.abortOnUnmount;
    }
  }
}

export default XhrRequest;
export { areRequestParamsEquals };
