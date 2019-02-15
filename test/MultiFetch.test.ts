import { createElement } from 'react';
import * as TestRenderer from 'react-test-renderer';
import MultiFetch from '../src/MultiFetch';
import cache from '../src/utils/cache';
import { createXhrMock } from './utils/xhr';
import { flushMountedComponents } from './utils/components';

const global: any = window;
const nativeXhr = global.XMLHttpRequest;

describe('MultiFetch', () => {
  const mountedComponents: TestRenderer.ReactTestRenderer[] = [];

  afterEach(() => {
    flushMountedComponents(mountedComponents);
    cache.reset();
    global.XMLHttpRequest = nativeXhr;
  });

  test('Open and send several requests when MultiFetch is mounted', () => {
    const xhrMock = createXhrMock({});
    const xhrInstance = new xhrMock();
    global.XMLHttpRequest = jest.fn(() => xhrInstance) as any;

    const requests = {
      data1: { url: 'http://fake-url.com' },
      data2: { url: 'http://fake-url-2.com' },
    };

    const fetchElement = createElement(MultiFetch, {
      requests,
      children: () => createElement('div'),
      loaderDelay: 0,
      withProgress: false,
    });

    mountedComponents.push(TestRenderer.create(fetchElement));

    const nbRequestAttempted = Object.keys(requests).length;
    expect(xhrInstance.open.mock.calls.length).toBe(nbRequestAttempted);
    expect(xhrInstance.send.mock.calls.length).toBe(nbRequestAttempted);
  });

  test('Abort requests if component is unmount before load end', () => {
    return new Promise(resolve => {
      const loadingDuration = 100;
      const unmountDelay = 20;
      const xhrMock = createXhrMock({ duration: loadingDuration });
      const xhrInstance = new xhrMock();
      global.XMLHttpRequest = jest.fn(() => xhrInstance) as any;

      const requests = {
        data1: { url: 'http://fake-url.com' },
        data2: { url: 'http://fake-url-2.com' },
      };

      const fetchElement = createElement(MultiFetch, {
        requests,
        children: () => createElement('div'),
        loaderDelay: 0,
        withProgress: false,
      });

      const multiFetch = TestRenderer.create(fetchElement);

      setTimeout(() => {
        multiFetch.unmount();

        const nbRequestAttempted = Object.keys(requests).length;
        expect(xhrInstance.open.mock.calls.length).toBe(nbRequestAttempted);
        expect(xhrInstance.send.mock.calls.length).toBe(nbRequestAttempted);
        expect(xhrInstance.abort.mock.calls.length).toBe(nbRequestAttempted);
        resolve();
      }, unmountDelay);
    });
  });
});
