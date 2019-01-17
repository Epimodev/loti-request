import XhrRequest from './XhrRequest';
import { RequestParams } from './types';

let requests: XhrRequest<any>[] = [];

function getRequest(params: RequestParams) {
  const request = requests.find(currentRequest => currentRequest.hasSameParams(params));

  return request;
}

function getRequests() {
  // return new array to avoid cache mutation from external modules
  return [...requests];
}

function addRequest(request: XhrRequest<any>) {
  requests.unshift(request);
  request.onAbort = () => removeRequest(request);
  return request;
}

function removeRequest(request: XhrRequest<any>) {
  const index = requests.indexOf(request);
  if (index >= 0) {
    requests.splice(index, 1);
  }
}

function removeRequests(url: string | RegExp) {
  if (typeof url === 'string') {
    requests = requests.filter(request => {
      return request.params.url.indexOf(url) === -1;
    });
  } else {
    requests = requests.filter(request => {
      return !request.params.url.match(url);
    });
  }
}

function reset() {
  requests = [];
}

export default {
  getRequest,
  getRequests,
  addRequest,
  removeRequests,
  reset,
};
