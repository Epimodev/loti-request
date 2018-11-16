import { stringify } from 'query-string';
import * as swallowEquals from 'shallow-equal/objects';
import { FetchParams, RequestOptions, RequestState, HttpBody, XhrBody } from './types';

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
  params: FetchParams;
  state: RequestState<T> = createRequestState();
  onStateChangeListeners: ((newState: RequestState<T>) => void)[] = [];
  onAbort?: () => void;

  constructor(fetchParams: FetchParams, requestOptions: RequestOptions) {
    this.xhr = new XMLHttpRequest();
    this.params = fetchParams;
    this.options = requestOptions;
    this.fetch();
  }

  fetch() {
    const { url, method = 'GET', headers, query, body } = this.params;
    const { loaderDelay = 0, withProgress = false, responseType = 'json' } = this.options;

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
    this.setRequestState({
      status: 'SUCCESS',
      data: response,
      withLoader: false,
      error: undefined,
    });
  }

  private handleError(error: any) {
    this.setRequestState({ status: 'FAILED', error, withLoader: false });
  }

  hasSameParams(params: FetchParams) {
    return (
      this.params.url === params.url &&
      this.params.method === params.method &&
      areParamsEquals(this.params.query, params.query) &&
      areBodyEquals(this.params.body, params.body) &&
      areParamsEquals(this.params.headers, params.headers)
    );
  }

  addStateListener(callback: (newState: RequestState<T>) => void) {
    this.onStateChangeListeners.push(callback);
  }

  removeStateListener(callback: (newState: RequestState<T>) => void) {
    const callbackIndex = this.onStateChangeListeners.indexOf(callback);

    if (callbackIndex >= 0) {
      this.onStateChangeListeners.splice(callbackIndex, 1);
      if (this.onStateChangeListeners.length === 0 && this.state.status === 'LOADING') {
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
}

export default XhrRequest;
