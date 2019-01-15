import { createElement } from 'react';
import * as TestRenderer from 'react-test-renderer';
import Fetch from '../src/Fetch';
import cache from '../src/utils/cache';
import { FetchPolicy } from '../src/utils/types';
import { createXhrMock } from './utils/xhr';

const global: any = window;
const nativeXhr = global.XMLHttpRequest;

describe('Fetch', () => {
  afterEach(() => {
    cache.reset();
    global.XMLHttpRequest = nativeXhr;
  });

  test('Open and send a request when Fetch is mounted', () => {
    const xhrMock = createXhrMock({});
    const xhrInstance = new xhrMock();
    global.XMLHttpRequest = jest.fn(() => xhrInstance) as any;

    const fetchElement = createElement(Fetch, {
      url: 'http://fake-url.com',
      fetchPolicy: 'cache-first' as FetchPolicy,
      children: () => createElement('div'),
      loaderDelay: 0,
      withProgress: false,
    });

    TestRenderer.create(fetchElement);

    expect(xhrInstance.open.mock.calls.length).toBe(1);
    expect(xhrInstance.send.mock.calls.length).toBe(1);
  });

  test('Open and send 2 request when 2 Fetch are mounted', () => {
    const xhrMock = createXhrMock({});
    const xhrInstance = new xhrMock();
    global.XMLHttpRequest = jest.fn(() => xhrInstance) as any;

    const firstFetchElement = createElement(Fetch, {
      url: 'http://fake-url.com',
      fetchPolicy: 'cache-first' as FetchPolicy,
      children: () => createElement('div'),
      loaderDelay: 0,
      withProgress: false,
    });
    const secondFetchElement = createElement(Fetch, {
      url: 'http://fake-url-2.com',
      fetchPolicy: 'cache-first' as FetchPolicy,
      children: () => createElement('div'),
      loaderDelay: 0,
      withProgress: false,
    });

    TestRenderer.create(firstFetchElement);
    TestRenderer.create(secondFetchElement);

    expect(xhrInstance.open.mock.calls.length).toBe(2);
    expect(xhrInstance.send.mock.calls.length).toBe(2);
  });

  test("Don't send request twice when request is already loading", () => {
    return new Promise(resolve => {
      const loadingDuration = 50;
      const secondFetchDelay = 20;
      const xhrMock = createXhrMock({ duration: loadingDuration });
      const xhrInstance = new xhrMock();
      global.XMLHttpRequest = jest.fn(() => xhrInstance) as any;

      const firstFetchElement = createElement(Fetch, {
        url: 'http://fake-url.com',
        fetchPolicy: 'cache-first' as FetchPolicy,
        children: () => createElement('div'),
        loaderDelay: 0,
        withProgress: false,
      });
      const secondFetchElement = createElement(Fetch, {
        url: 'http://fake-url.com',
        fetchPolicy: 'cache-first' as FetchPolicy,
        children: () => createElement('span'),
        loaderDelay: 0,
        withProgress: false,
      });

      TestRenderer.create(firstFetchElement);
      setTimeout(() => {
        TestRenderer.create(secondFetchElement);

        expect(xhrInstance.open.mock.calls.length).toBe(1);
        expect(xhrInstance.send.mock.calls.length).toBe(1);
        resolve();
      }, secondFetchDelay);
    });
  });

  test("Don't send request twice when request is already succeed", () => {
    return new Promise(resolve => {
      const loadingDuration = 20;
      const secondFetchDelay = 50;
      const xhrMock = createXhrMock({ duration: loadingDuration });
      const xhrInstance = new xhrMock();
      global.XMLHttpRequest = jest.fn(() => xhrInstance) as any;

      const firstFetchElement = createElement(Fetch, {
        url: 'http://fake-url.com',
        fetchPolicy: 'cache-first' as FetchPolicy,
        children: () => createElement('div'),
        loaderDelay: 0,
        withProgress: false,
      });
      const secondFetchElement = createElement(Fetch, {
        url: 'http://fake-url.com',
        fetchPolicy: 'cache-first' as FetchPolicy,
        children: () => createElement('span'),
        loaderDelay: 0,
        withProgress: false,
      });

      TestRenderer.create(firstFetchElement);
      setTimeout(() => {
        TestRenderer.create(secondFetchElement);

        expect(xhrInstance.open.mock.calls.length).toBe(1);
        expect(xhrInstance.send.mock.calls.length).toBe(1);
        resolve();
      }, secondFetchDelay);
    });
  });

  // tslint:disable-next-line max-line-length
  test("When fetch policy is `network-only` don't send request twice when request is already loading", () => {
    return new Promise(resolve => {
      const loadingDuration = 50;
      const secondFetchDelay = 20;
      const xhrMock = createXhrMock({ duration: loadingDuration });
      const xhrInstance = new xhrMock();
      global.XMLHttpRequest = jest.fn(() => xhrInstance) as any;

      const firstFetchElement = createElement(Fetch, {
        url: 'http://fake-url.com',
        fetchPolicy: 'network-only' as FetchPolicy,
        children: () => createElement('div'),
        loaderDelay: 0,
        withProgress: false,
      });
      const secondFetchElement = createElement(Fetch, {
        url: 'http://fake-url.com',
        fetchPolicy: 'network-only' as FetchPolicy,
        children: () => createElement('span'),
        loaderDelay: 0,
        withProgress: false,
      });

      TestRenderer.create(firstFetchElement);
      setTimeout(() => {
        TestRenderer.create(secondFetchElement);

        expect(xhrInstance.open.mock.calls.length).toBe(1);
        expect(xhrInstance.send.mock.calls.length).toBe(1);
        resolve();
      }, secondFetchDelay);
    });
  });

  // tslint:disable-next-line max-line-length
  test('When fetch policy is `network-only` send request twice even if request is already succeed', () => {
    return new Promise(resolve => {
      const loadingDuration = 20;
      const secondFetchDelay = 50;
      const xhrMock = createXhrMock({ duration: loadingDuration });
      const xhrInstance = new xhrMock();
      global.XMLHttpRequest = jest.fn(() => xhrInstance) as any;

      const firstFetchElement = createElement(Fetch, {
        url: 'http://fake-url.com',
        fetchPolicy: 'network-only' as FetchPolicy,
        children: () => createElement('div'),
        loaderDelay: 0,
        withProgress: false,
      });
      const secondFetchElement = createElement(Fetch, {
        url: 'http://fake-url.com',
        fetchPolicy: 'network-only' as FetchPolicy,
        children: () => createElement('span'),
        loaderDelay: 0,
        withProgress: false,
      });

      TestRenderer.create(firstFetchElement);
      setTimeout(() => {
        TestRenderer.create(secondFetchElement);

        expect(xhrInstance.open.mock.calls.length).toBe(2);
        expect(xhrInstance.send.mock.calls.length).toBe(2);
        resolve();
      }, secondFetchDelay);
    });
  });

  test('Resent request if first request failed', () => {
    return new Promise(resolve => {
      const loadingDuration = 20;
      const secondFetchDelay = 50;
      const xhrMock = createXhrMock({ duration: loadingDuration, willFail: true });
      const xhrInstance = new xhrMock();
      global.XMLHttpRequest = jest.fn(() => xhrInstance) as any;

      const firstFetchElement = createElement(Fetch, {
        url: 'http://fake-url.com',
        fetchPolicy: 'cache-first' as FetchPolicy,
        children: () => createElement('div'),
        loaderDelay: 0,
        withProgress: false,
      });
      const secondFetchElement = createElement(Fetch, {
        url: 'http://fake-url.com',
        fetchPolicy: 'cache-first' as FetchPolicy,
        children: () => createElement('span'),
        loaderDelay: 0,
        withProgress: false,
      });

      TestRenderer.create(firstFetchElement);
      setTimeout(() => {
        TestRenderer.create(secondFetchElement);

        expect(xhrInstance.open.mock.calls.length).toBe(2);
        expect(xhrInstance.send.mock.calls.length).toBe(2);
        resolve();
      }, secondFetchDelay);
    });
  });

  test('Abort request when fetch is unmount before load end', () => {
    return new Promise(resolve => {
      const loadingDuration = 100;
      const unmountDelay = 20;
      const xhrMock = createXhrMock({ duration: loadingDuration });
      const xhrInstance = new xhrMock();
      global.XMLHttpRequest = jest.fn(() => xhrInstance) as any;

      const firstFetchElement = createElement(Fetch, {
        url: 'http://fake-url.com',
        fetchPolicy: 'cache-first' as FetchPolicy,
        children: () => createElement('div'),
        loaderDelay: 0,
        withProgress: false,
      });

      const firstFetch = TestRenderer.create(firstFetchElement);

      setTimeout(() => {
        firstFetch.unmount();

        expect(xhrInstance.open.mock.calls.length).toBe(1);
        expect(xhrInstance.send.mock.calls.length).toBe(1);
        expect(xhrInstance.abort.mock.calls.length).toBe(1);
        resolve();
      }, unmountDelay);
    });
  });

  test('Don\'t abort request when abortOnUnmount is disabled', () => {
    return new Promise(resolve => {
      const loadingDuration = 100;
      const unmountDelay = 20;
      const xhrMock = createXhrMock({ duration: loadingDuration });
      const xhrInstance = new xhrMock();
      global.XMLHttpRequest = jest.fn(() => xhrInstance) as any;

      const firstFetchElement = createElement(Fetch, {
        url: 'http://fake-url.com',
        fetchPolicy: 'cache-first' as FetchPolicy,
        children: () => createElement('div'),
        loaderDelay: 0,
        withProgress: false,
        abortOnUnmount: false,
      });

      const firstFetch = TestRenderer.create(firstFetchElement);

      setTimeout(() => {
        firstFetch.unmount();

        expect(xhrInstance.open.mock.calls.length).toBe(1);
        expect(xhrInstance.send.mock.calls.length).toBe(1);
        expect(xhrInstance.abort.mock.calls.length).toBe(0);
        resolve();
      }, unmountDelay);
    });
  });

  test("Don't abort request when fetch is unmount and another fetch is mounted", () => {
    return new Promise(resolve => {
      const loadingDuration = 100;
      const unmountDelay = 20;
      const xhrMock = createXhrMock({ duration: loadingDuration });
      const xhrInstance = new xhrMock();
      global.XMLHttpRequest = jest.fn(() => xhrInstance) as any;

      const firstFetchElement = createElement(Fetch, {
        url: 'http://fake-url.com',
        fetchPolicy: 'cache-first' as FetchPolicy,
        children: () => createElement('div'),
        loaderDelay: 0,
        withProgress: false,
      });
      const secondFetchElement = createElement(Fetch, {
        url: 'http://fake-url.com',
        fetchPolicy: 'cache-first' as FetchPolicy,
        children: () => createElement('div'),
        loaderDelay: 0,
        withProgress: false,
      });

      const firstFetch = TestRenderer.create(firstFetchElement);
      TestRenderer.create(secondFetchElement);

      setTimeout(() => {
        firstFetch.unmount();

        expect(xhrInstance.open.mock.calls.length).toBe(1);
        expect(xhrInstance.send.mock.calls.length).toBe(1);
        expect(xhrInstance.abort.mock.calls.length).toBe(0);
        resolve();
      }, unmountDelay);
    });
  });
});
