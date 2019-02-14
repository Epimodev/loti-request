import XhrRequest from '../src/utils/XhrRequest';
import { RequestParams, RequestOptions } from '../src/utils/types';
import { createXhrMock } from './utils/xhr';

const global: any = window;
const nativeXhr = global.XMLHttpRequest;

describe('XhrRequest', () => {
  afterEach(() => {
    global.XMLHttpRequest = nativeXhr;
  });

  test('Open and send a request at XhrRequest instanciation', () => {
    const xhrMock = createXhrMock({});
    const xhrInstance = new xhrMock();
    global.XMLHttpRequest = jest.fn(() => xhrInstance) as any;
    const fetchParams: RequestParams = {
      url: 'http://fake-url.com',
    };
    const options: RequestOptions = {
      loaderDelay: 0,
      withProgress: false,
    };

    const request = new XhrRequest(fetchParams, options);

    expect(xhrInstance.open.mock.calls.length).toBe(1);
    expect(xhrInstance.send.mock.calls.length).toBe(1);
  });
});
