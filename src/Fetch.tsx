import { createElement, Component, ReactNode } from 'react';
import XhrRequest from './utils/XhrRequest';
import cache from './utils/cache';
import { RequestContext } from './RequestProvider';
import { FetchState, RequestState, FetchParams, RequestOptions, FetchPolicy } from './utils/types';

interface ChildrenParams<T> extends FetchState<T> {
  refetch: () => void;
}

interface FetchInContextProps<T> extends FetchParams, RequestOptions {
  children: (params: ChildrenParams<T>) => ReactNode;
  fetchPolicy?: FetchPolicy;
  onSuccess?: (data: T) => void;
  onError?: (error: any) => void;
}

interface FetchProps<T> extends FetchParams, RequestOptions, FetchInContextProps<T> {
  fetchPolicy: FetchPolicy;
}

interface Props<T> extends FetchProps<T> {
  contextHeaders: { [key: string]: string };
}

interface State<T> extends FetchState<T> {}

class Fetch<T = { [key: string]: any }> extends Component<Props<T>, State<T>> {
  request: XhrRequest<T>;

  constructor(props: Props<T>) {
    super(props);

    this.updateRequestState = this.updateRequestState.bind(this);
    this.refetch = this.refetch.bind(this);

    this.request = this.getRequest();
    if (this.request.state.status === 'FAILED') {
      this.request.refetch();
    }
    this.request.addStateListener(this.updateRequestState);

    this.state = this.getRequestState();
  }

  componentWillUnmount() {
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

  componentDidUpdate() {
    const fetchParams = this.getFetchParams();

    if (!this.request.hasSameParams(fetchParams)) {
      this.request.removeStateListener(this.updateRequestState);

      this.request = this.getRequest();
      if (this.request.state.status === 'FAILED') {
        this.request.refetch();
      }
      this.request.addStateListener(this.updateRequestState);

      this.setState(this.getRequestState());
    }
  }

  getRequest(): XhrRequest<T> {
    const { fetchPolicy } = this.props;
    const fetchParams = this.getFetchParams();
    const requestOptions = this.getRequestOptions();

    const cachedRequest = cache.getRequest(fetchParams);
    if (cachedRequest) {
      cachedRequest.updateOptions(requestOptions);
      if (fetchPolicy === 'cache-first' || cachedRequest.state.status === 'LOADING') {
        return cachedRequest;
      }
    }

    const request = new XhrRequest<T>(fetchParams, requestOptions);
    cache.addRequest(request);

    return request;
  }

  getRequestState(): FetchState<T> {
    const requestState = this.request.state;
    const status = requestState.status === 'NOT_SEND' ? 'LOADING' : requestState.status;
    return { ...requestState, status };
  }

  getFetchParams(): FetchParams {
    const { url, method, headers, query, body, contextHeaders } = this.props;

    return {
      url,
      method,
      headers: { ...contextHeaders, ...headers },
      query,
      body,
    };
  }

  getRequestOptions(): RequestOptions {
    const { loaderDelay, withProgress, abortOnUnmount } = this.props;
    return {
      loaderDelay,
      withProgress,
      abortOnUnmount,
    };
  }

  updateRequestState(requestState: RequestState<T>) {
    const status = requestState.status === 'NOT_SEND' ? 'LOADING' : requestState.status;

    this.setState({ ...requestState, status });

    const { onSuccess, onError } = this.props;
    if (onSuccess && requestState.status === 'SUCCESS') {
      onSuccess(requestState.data!);
    } else if (onError && requestState.status === 'FAILED') {
      onError(requestState.error);
    }
  }

  refetch() {
    this.request.refetch();
  }

  render() {
    return this.props.children({
      ...this.state,
      refetch: this.refetch,
    });
  }
}

function FetchInContext<T>({ fetchPolicy = 'cache-first', ...props }: FetchInContextProps<T>) {
  return (
    <RequestContext.Consumer>
      {headers => <Fetch<T> fetchPolicy={fetchPolicy} {...props} contextHeaders={headers} />}
    </RequestContext.Consumer>
  );
}
export default FetchInContext;
