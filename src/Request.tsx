import { createElement, Component, ReactNode } from 'react';
import XhrRequest from './utils/XhrRequest';
import { RequestContext } from './RequestProvider';
import { RequestState, RequestParams, RequestOptions } from './utils/types';

interface ChildrenParams<T> extends RequestState<T> {
  fetch: (params?: Partial<RequestParams>) => void;
}

interface RequestProps<T> extends Partial<RequestParams>, RequestOptions {
  children: (params: ChildrenParams<T>) => ReactNode;
  onSuccess?: (data: T, params: RequestParams) => void;
  onError?: (error: any, params: RequestParams) => void;
}

interface Props<T> extends RequestProps<T> {
  contextHeaders: { [key: string]: string };
}

interface State<T> extends RequestState<T> {}

class Request<T> extends Component<Props<T>, State<T>> {
  request: XhrRequest<T> | null = null;

  constructor(props: Props<T>) {
    super(props);

    this.updateRequestState = this.updateRequestState.bind(this);
    this.fetch = this.fetch.bind(this);

    this.state = { status: 'NOT_SEND', withLoader: false, progress: { loaded: 0, total: 1 } };
  }

  componentWillUnmount() {
    if (this.request) {
      const { onSuccess, onError, abortOnUnmount } = this.props;
      if (this.request.state.status === 'LOADING' && !abortOnUnmount) {
        if (onSuccess) {
          this.request.addSuccessCallbacks(onSuccess);
        }
        if (onError) {
          this.request.addErrorCallbacks(onError);
        }
      }

      this.request.removeStateListener(this.updateRequestState);
    }
  }

  updateRequestState(requestState: RequestState<T>) {
    this.setState(requestState);

    const { onSuccess, onError } = this.props;
    if (onSuccess && requestState.status === 'SUCCESS') {
      onSuccess(requestState.data!, this.request!.params);
    } else if (onError && requestState.status === 'FAILED') {
      onError(requestState.error, this.request!.params);
    }
  }

  getFetchParams(params?: Partial<RequestParams>): RequestParams {
    const { url, method, headers, query, body, contextHeaders } = this.props;
    if (url || (params && params.url)) {
      const paramsHeader = params ? params.headers : undefined;
      const requestHeaders = { ...contextHeaders, ...headers, ...paramsHeader };
      return {
        url: url!,
        method,
        headers: requestHeaders,
        query,
        body,
        ...params,
      };
    }
    throw new Error('url is missing in Request component');
  }

  getRequestOptions(): RequestOptions {
    const { loaderDelay, withProgress, abortOnUnmount } = this.props;
    return {
      loaderDelay,
      withProgress,
      abortOnUnmount,
    };
  }

  fetch(params?: Partial<RequestParams>) {
    if (this.request) {
      this.request.removeStateListener(this.updateRequestState);
    }
    const requestParams = this.getFetchParams(params);
    const requestOptions = this.getRequestOptions();
    this.request = new XhrRequest(requestParams, requestOptions);
    this.updateRequestState(this.request.state);
    this.request.addStateListener(this.updateRequestState);
    this.request.fetch();
  }

  render() {
    return this.props.children({
      ...this.state,
      fetch: this.fetch,
    });
  }
}

function RequestInContext<T>(props: RequestProps<T>) {
  return (
    <RequestContext.Consumer>
      {headers => <Request<T> {...props} contextHeaders={headers} />}
    </RequestContext.Consumer>
  );
}
export default RequestInContext;
