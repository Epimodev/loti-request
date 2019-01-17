import { createElement, Component, ReactNode } from 'react';
import XhrRequest from './utils/XhrRequest';
import cache from './utils/cache';
import { RequestContext } from './RequestProvider';
import { FetchState, RequestParams, RequestOptions } from './utils/types';

interface ChildrenParams<T> extends FetchState<T> {
  refetch: () => void;
}

interface MultiFetchProps<T> extends RequestOptions {
  children: (params: ChildrenParams<T>) => ReactNode;
  requests: { [key: string]: RequestParams };
  onSuccess?: (data: T) => void;
  onError?: (error: any) => void;
}

interface Props<T> extends MultiFetchProps<T> {
  contextHeaders: { [key: string]: string };
}

interface State<T> {
  requestState: FetchState<T>;
}

class MultiFetch<T = { [key: string]: any }> extends Component<Props<T>, State<T>> {
  requests: { [key: string]: XhrRequest<T> } = {};

  constructor(props: Props<T>) {
    super(props);

    this.updateRequestState = this.updateRequestState.bind(this);
    this.refetch = this.refetch.bind(this);

    this.requests = this.getRequests();
    const requestKeys = Object.keys(this.requests);
    requestKeys.forEach(key => {
      if (this.requests[key].state.status === 'FAILED') {
        this.requests[key].refetch();
      }
    });
    this.addRequestListeners(requestKeys);

    this.state = { requestState: this.getRequestsState() };
  }

  componentWillUnmount() {
    this.removeRequestListeners(Object.keys(this.requests));
  }

  componentDidUpdate(prevProps: Props<T>) {
    if (prevProps.requests !== this.props.requests) {
      const previousKeys = Object.keys(prevProps.requests);
      const currentKeys = Object.keys(this.props.requests);
      const removedKeys = previousKeys.filter(key => currentKeys.indexOf(key) === -1);
      const newKeys = currentKeys.filter(key => previousKeys.indexOf(key) === -1);
      const changedKeys = currentKeys.filter(key => {
        if (previousKeys.indexOf(key) === -1) {
          return false;
        }
        const newFetchParams = this.props.requests[key];
        return !this.requests[key].hasSameParams(newFetchParams);
      });
      // remove listener only on removed keys or changed
      this.removeRequestListeners([...removedKeys, ...changedKeys]);

      this.requests = this.getRequests();
      currentKeys.forEach(key => {
        if (this.requests[key].state.status === 'FAILED') {
          this.requests[key].refetch();
        }
      });
      // we don't have to add listener on requests not changed
      this.addRequestListeners([...newKeys, ...changedKeys]);

      this.state = { requestState: this.getRequestsState() };
    }
  }

  getRequests(): { [key: string]: XhrRequest<T> } {
    const requestKeys = Object.keys(this.props.requests);
    const requests: { [key: string]: XhrRequest<T> } = {};
    requestKeys.forEach(key => {
      requests[key] = this.getRequest(this.props.requests[key]);
    });

    return requests;
  }

  getRequest(params: RequestParams): XhrRequest<T> {
    const { contextHeaders } = this.props;
    // Append headers of RequestProvider
    const fetchParams = {
      ...params,
      headers: { ...params.headers, ...contextHeaders },
    };

    const cachedRequest = cache.getRequest(fetchParams);
    if (cachedRequest) {
      return cachedRequest;
    }

    const requestOptions = this.getRequestOptions();
    const request = new XhrRequest<T>(fetchParams, requestOptions);
    cache.addRequest(request);
    return request;
  }

  addRequestListeners(newRequestKeys: string[]) {
    newRequestKeys.forEach(key => {
      this.requests[key].addStateListener(this.updateRequestState);
    });
  }

  removeRequestListeners(requestKeys: string[]) {
    requestKeys.forEach(key => {
      this.requests[key].removeStateListener(this.updateRequestState);
    });
  }

  getRequestOptions(): RequestOptions {
    const { loaderDelay, withProgress } = this.props;
    return {
      loaderDelay,
      withProgress,
    };
  }

  updateRequestState() {
    const requestState = this.getRequestsState();
    this.setState({ requestState });
  }

  getRequestsState(): FetchState<T> {
    const errors = this.getErrors();
    if (Object.keys(errors).length > 0) {
      return {
        status: 'FAILED',
        error: errors,
        withLoader: false,
        progress: { loaded: 0, total: 1 },
      };
    }

    const loadingRequestStates = this.getLoadingRequestState();
    const loadingKeys = Object.keys(loadingRequestStates);
    if (loadingKeys.length > 0) {
      const withLoader = loadingKeys.some(key => loadingRequestStates[key].withLoader);

      return {
        status: 'LOADING',
        progress: { loaded: 0, total: 1 },
        withLoader,
      };
    }

    const successData = this.getSuccessData();
    return {
      status: 'SUCCESS',
      data: successData,
      withLoader: false,
      progress: { loaded: 0, total: 1 },
    };
  }

  getErrors(): { [key: string]: any } {
    return Object.keys(this.requests).reduce((acc, key) => {
      const request = this.requests[key];

      if (request.state.status === 'FAILED') {
        return { ...acc, [key]: request.state.error };
      }

      return acc;
    }, {});
  }

  getLoadingRequestState(): { [key: string]: { status: 'LOADING'; withLoader: boolean } } {
    return Object.keys(this.requests).reduce((acc, key) => {
      const request = this.requests[key];

      if (request.state.status === 'LOADING') {
        return { ...acc, [key]: request.state };
      }

      return acc;
    }, {});
  }

  getSuccessData(): T {
    return Object.keys(this.requests).reduce((acc: object, key) => {
      const request = this.requests[key];

      if (request.state.status === 'SUCCESS') {
        return { ...acc, [key]: request.state.data };
      }

      return acc;
    }, {}) as T;
  }

  refetch() {
    Object.keys(this.requests).forEach(key => this.requests[key].refetch());
  }

  render() {
    return this.props.children({
      ...this.state.requestState,
      refetch: this.refetch,
    });
  }
}

function MultiFetchInContext<T>(props: MultiFetchProps<T>) {
  return (
    <RequestContext.Consumer>
      {headers => <MultiFetch<T> {...props} contextHeaders={headers} />}
    </RequestContext.Consumer>
  );
}
export default MultiFetchInContext;
