import { useContext, useState, useEffect } from 'react';
import * as swallowEquals from 'shallow-equal/objects';
import { useSpecificMemo } from './utils/hooks';
import XhrRequest, { areRequestParamsEquals } from './utils/XhrRequest';
import cache from './utils/cache';
import { RequestContext } from './RequestProvider';
import {
  FetchState,
  RequestState,
  RequestParams,
  RequestOptions,
  FetchPolicy,
} from './utils/types';

interface FetchOptions<T> extends RequestParams, RequestOptions {
  fetchPolicy?: FetchPolicy;
  onSuccess?: (data: T, params: RequestParams) => void;
  onError?: (error: any, params: RequestParams) => void;
}

interface ChildrenParams<T> extends FetchState<T> {
  refetch: () => void;
}

type RequestDep = RequestParams | { [key: string]: string };

function hasRequestDepChanged(depsA: RequestDep, depsB: RequestDep): boolean {
  // if deps are RequestParams
  if (depsA.url && depsB.url) {
    return areRequestParamsEquals(depsA as RequestParams, depsB as RequestParams);
  }
  // if deps are contextHeader
  return swallowEquals(depsA, depsB);
}

function getRequestParams(
  options: FetchOptions<any>,
  contextHeaders: { [key: string]: string },
): RequestParams {
  const { url, method, headers, query, body, responseType } = options;

  return {
    url,
    method,
    headers: { ...contextHeaders, ...headers },
    query,
    body,
    responseType,
  };
}

function getRequestOptions(options: FetchOptions<any>): RequestOptions {
  const { loaderDelay, withProgress, abortOnUnmount } = options;
  return {
    loaderDelay,
    withProgress,
    abortOnUnmount,
  };
}

function getRequest<T>(
  options: FetchOptions<T>,
  contextHeaders: { [key: string]: string },
): XhrRequest<T> {
  const { fetchPolicy = 'cache-first' } = options;
  const requestParams = getRequestParams(options, contextHeaders);
  const requestOptions = getRequestOptions(options);

  const cachedRequest = cache.getRequest(requestParams);
  if (cachedRequest) {
    cachedRequest.updateOptions(requestOptions);
    if (fetchPolicy === 'cache-first' || cachedRequest.state.status === 'LOADING') {
      return cachedRequest;
    }
  }

  const request = new XhrRequest<T>(requestParams, requestOptions);
  cache.addRequest(request);

  return request;
}

function formatRequestState<T>(state: RequestState<T>): FetchState<T> {
  const status = state.status === 'NOT_SEND' ? 'LOADING' : state.status;
  return { ...state, status };
}

function useFetch<T>(options: FetchOptions<T>): ChildrenParams<T> {
  const contextHeaders = useContext(RequestContext);
  const requestParams = getRequestParams(options, contextHeaders);
  const request = useSpecificMemo(
    () => getRequest(options, contextHeaders),
    [requestParams],
    hasRequestDepChanged,
  );
  const [fetchState, setFetchState] = useState(() => formatRequestState(request.state));

  useEffect(() => {
    const updateRequestState = (requestState: RequestState<T>) => {
      const { onSuccess, onError } = options;
      if (onSuccess && requestState.status === 'SUCCESS') {
        onSuccess(requestState.data!, request.params);
      } else if (onError && requestState.status === 'FAILED') {
        onError(requestState.error, request.params);
      }

      setFetchState(formatRequestState(requestState));
    };

    request.addStateListener(updateRequestState);

    switch (request.state.status) {
      case 'FAILED':
        request.refetch();
        break;
      case 'NOT_SEND':
        request.fetch();
        break;
    }

    return () => {
      const { onSuccess, onError, abortOnUnmount } = options;
      if (request.state.status === 'LOADING' && !abortOnUnmount) {
        if (onSuccess) {
          request.addSuccessCallbacks(onSuccess);
        }
        if (onError) {
          request.addErrorCallbacks(onError);
        }
      }

      request.removeStateListener(updateRequestState);
    };
  }, [request]);

  return {
    ...fetchState,
    refetch: request.refetch,
  };
}

export default useFetch;
export { FetchOptions, ChildrenParams };
