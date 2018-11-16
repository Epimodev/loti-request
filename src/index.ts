import RequestProvider from './RequestProvider';
import Fetch from './Fetch';
import MultiFetch from './MultiFetch';
import Request from './Request';
import cache from './utils/cache';
import { RequestState, FetchState } from './utils/types';

const { removeRequests: removeCachedRequests, reset: resetCache } = cache;

export {
  RequestProvider,
  Fetch,
  MultiFetch,
  Request,
  removeCachedRequests,
  resetCache,
  RequestState,
  FetchState,
};
