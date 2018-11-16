import XhrRequest from '../src/utils/XhrRequest';
import cache from '../src/utils/cache';
import { createXhrMock } from './utils/xhr';

const global: any = window;
const nativeXhr = global.XMLHttpRequest;

beforeEach(() => {
  const xhrMock = createXhrMock({});
  const xhrInstance = new xhrMock();
  global.XMLHttpRequest = jest.fn(() => xhrInstance) as any;
});
afterEach(() => {
  cache.reset();
  global.XMLHttpRequest = nativeXhr;
});

describe('addRequest', () => {
  test('should add a request in cache', () => {
    const firstRequest = new XhrRequest({ url: '/hello/test' }, {});
    const secondRequest = new XhrRequest({ url: '/goodby/test' }, {});
    cache.addRequest(firstRequest);
    cache.addRequest(secondRequest);

    const cachedRequests = cache.getRequests();
    expect(cachedRequests).toHaveLength(2);
    expect(cachedRequests[1]).toBe(firstRequest);
    expect(cachedRequests[0]).toBe(secondRequest);
  });

  test('should remove added request if request is aborted', () => {
    const firstRequest = new XhrRequest({ url: '/hello/test' }, {});
    const secondRequest = new XhrRequest({ url: '/goodby/test' }, {});
    cache.addRequest(firstRequest);
    cache.addRequest(secondRequest);
    if (firstRequest.onAbort) {
      firstRequest.onAbort();
    }

    const cachedRequests = cache.getRequests();
    expect(cachedRequests).toHaveLength(1);
    expect(cachedRequests[0]).toBe(secondRequest);
  });
});

describe('removeRequests', () => {
  test('Remove only requests which contains url param', () => {
    const firstRequest = new XhrRequest({ url: '/hello' }, {});
    const secondRequest = new XhrRequest({ url: '/hello/test' }, {});
    const thirdRequest = new XhrRequest({ url: '/goodby/test' }, {});
    cache.addRequest(firstRequest);
    cache.addRequest(secondRequest);
    cache.addRequest(thirdRequest);
    cache.removeRequests('hello');

    const cachedRequests = cache.getRequests();
    expect(cachedRequests).toHaveLength(1);
    expect(cachedRequests[0]).toBe(thirdRequest);
  });

  test('Remove only requests which match with regex', () => {
    const firstRequest = new XhrRequest({ url: '/hello' }, {});
    const secondRequest = new XhrRequest({ url: '/hello/1234' }, {});
    const thirdRequest = new XhrRequest({ url: '/goodby/test' }, {});
    cache.addRequest(firstRequest);
    cache.addRequest(secondRequest);
    cache.addRequest(thirdRequest);
    cache.removeRequests(/hello\/\d*$/);

    const cachedRequests = cache.getRequests();
    expect(cachedRequests).toHaveLength(2);
    expect(cachedRequests[0]).toBe(thirdRequest);
    expect(cachedRequests[1]).toBe(firstRequest);
  });
});
