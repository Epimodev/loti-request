import { useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useShallowEqualsMemo, useUnmount } from './utils/hooks';
import XhrRequest from './utils/XhrRequest';
import { RequestContext } from './RequestProvider';
import { RequestState, RequestParams, RequestOptions } from './utils/types';

interface UseRequestOptions<T> extends Partial<RequestParams>, RequestOptions {
  onSuccess?: (data: T, params: RequestParams) => void;
  onError?: (response: any, statusCode: number, params: RequestParams) => void;
}

interface ChildrenParams<T> extends RequestState<T> {
  fetch: (params?: Partial<RequestParams>) => void;
}

function getInitialRequestState(): RequestState<any> {
  return {
    status: 'NOT_SEND',
    statusCode: 0,
    withLoader: false,
    progress: { loaded: 0, total: 1 },
  };
}

function getRequestParams(
  params: Partial<RequestParams>,
  options: UseRequestOptions<any>,
  contextHeaders: { [key: string]: string },
): RequestParams {
  const { url, method, headers, query, body } = options;
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

function getRequestOptions(options: UseRequestOptions<any>): RequestOptions {
  const { loaderDelay, withProgress, abortOnUnmount } = options;
  return {
    loaderDelay,
    withProgress,
    abortOnUnmount,
  };
}

function getRequest<T>(
  params: Partial<RequestParams>,
  options: UseRequestOptions<T>,
  contextHeaders: { [key: string]: string },
): XhrRequest<T> {
  const requestParams = getRequestParams(params, options, contextHeaders);
  const requestOptions = getRequestOptions(options);

  const request = new XhrRequest<T>(requestParams, requestOptions);

  return request;
}

function useRequest<T>(options: UseRequestOptions<T>): ChildrenParams<T> {
  const contextHeaders = useContext(RequestContext);
  const requestRef = useRef<XhrRequest<T> | null>(null);
  const [requestState, setRequestState] = useState(() => getInitialRequestState());
  const memoizedOptions = useShallowEqualsMemo(() => options, [options]);
  const { onSuccess, onError } = memoizedOptions;

  const updateRequestState = useCallback((requestState: RequestState<T>) => {
    const { current: request } = requestRef;
    if (onSuccess && requestState.status === 'SUCCESS') {
      onSuccess(requestState.data!, request!.params);
    } else if (onError && requestState.status === 'FAILED') {
      onError(requestState.error, requestState.statusCode, request!.params);
    }

    setRequestState(requestState);
  }, []);

  const fetch = useCallback(
    (params: Partial<RequestParams> = {}) => {
      if (requestRef.current) {
        requestRef.current.removeStateListener(updateRequestState);
      }
      const newRequest = getRequest(params, memoizedOptions, contextHeaders);
      newRequest.addStateListener(updateRequestState);
      newRequest.fetch();
      requestRef.current = newRequest;
    },
    [memoizedOptions, contextHeaders],
  );

  useUnmount(() => {
    if (requestRef.current) {
      const { onSuccess, onError, abortOnUnmount } = options;
      if (requestRef.current.state.status === 'LOADING' && !abortOnUnmount) {
        if (onSuccess) {
          requestRef.current.addSuccessCallbacks(onSuccess);
        }
        if (onError) {
          requestRef.current.addErrorCallbacks(onError);
        }
      }

      requestRef.current.removeStateListener(updateRequestState);
    }
  });

  return {
    ...requestState,
    fetch,
  };
}

export default useRequest;
export { UseRequestOptions, ChildrenParams };
