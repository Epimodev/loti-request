import XhrRequest from './XhrRequest';
import { FetchParams } from './types';

let requests: XhrRequest<any>[] = [];

function getRequest(params: FetchParams) {
  const request = requests.find(currentRequest => currentRequest.hasSameParams(params));

  return request;
}

function addRequest(request: XhrRequest<any>) {
  requests.push(request);
  request.onAbort = () => removeRequest(request);
  return request;
}

function removeRequest(request: XhrRequest<any>) {
  const index = requests.indexOf(request);
  if (index >= 0) {
    requests.splice(index, 1);
  }
}

function reset() {
  requests = [];
}

export default {
  getRequest,
  addRequest,
  reset,
};
