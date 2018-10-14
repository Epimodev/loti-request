import { createElement, Component, ReactNode } from 'react';
import XhrRequest from './utils/XhrRequest';
import cache from './utils/cache';
import { RequestContext } from './RequestProvider';
import { FetchState, RequestState, FetchParams, RequestOptions } from './utils/types';

interface ChildrenParams<T> {
  requestState: FetchState<T>;
  refetch: () => void;
}

interface FetchProps<T> extends FetchParams, RequestOptions {
  children: (params: ChildrenParams<T>) => ReactNode;
  onSuccess?: (data: T) => void;
  onError?: (error: any) => void;
}

interface Props<T> extends FetchProps<T> {
  contextHeaders: { [key: string]: string };
}

interface State<T> {
  requestState: FetchState<T>;
}

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

    this.state = {
      requestState: this.getInitialRequestState(),
    };
  }

  componentWillUnmount() {
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

      if (this.request.state.status !== 'NOT_SEND') {
        this.setState({
          requestState: this.request.state,
        });
      }
    }
  }

  getRequest() {
    const fetchParams = this.getFetchParams();
    const requestOptions = this.getRequestOptions();
    let request: XhrRequest<T>;

    const cachedRequest = cache.getRequest(fetchParams);
    if (cachedRequest) {
      request = cachedRequest;
    } else {
      request = new XhrRequest(fetchParams, requestOptions);
      cache.addRequest(request);
    }

    return request;
  }

  getInitialRequestState(): FetchState<T> {
    if (this.request.state.status === 'NOT_SEND') {
      return {
        status: 'LOADING',
        loaded: 0,
        total: 1,
        timeoutReached: false,
      };
    }
    return this.request.state;
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
    const { loaderDelay, withProgress } = this.props;
    return {
      loaderDelay,
      withProgress,
    };
  }

  updateRequestState(requestState: RequestState<T>) {
    if (requestState.status !== 'NOT_SEND') {
      this.setState({ requestState });

      const { onSuccess, onError } = this.props;
      if (onSuccess && requestState.status === 'SUCCESS') {
        onSuccess(requestState.data);
      } else if (onError && requestState.status === 'FAILED') {
        onError(requestState.error);
      }
    }
  }

  refetch() {
    this.request.refetch();
  }

  render() {
    return this.props.children({
      requestState: this.state.requestState,
      refetch: this.refetch,
    });
  }
}

function FetchInContext<T>(props: FetchProps<T>) {
  return (
    <RequestContext.Consumer>
      {headers => <Fetch<T> {...props} contextHeaders={headers} />}
    </RequestContext.Consumer>
  );
}
export default FetchInContext;
