import RequestProvider from './RequestProvider';
import useFetch from './useFetch';
import useRequest from './useRequest';
import Fetch from './Fetch';
import Request from './Request';
import cache from './utils/cache';
import { RequestParams, RequestState, FetchState } from './utils/types';

const { removeRequests: removeCachedRequests, reset: resetCache } = cache;

export {
  RequestProvider,
  useFetch,
  useRequest,
  Fetch,
  Request,
  removeCachedRequests,
  resetCache,
  RequestParams,
  RequestState,
  FetchState,
};
