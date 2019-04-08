import { createElement } from 'react';
import * as TestRenderer from 'react-test-renderer';
import Fetch from '../src/Fetch';
import cache from '../src/utils/cache';
import { FetchPolicy } from '../src/utils/types';
import { createXhrMock } from './utils/xhr';
import { flushMountedComponents } from './utils/components';

/**
 * All mounted component shoud be push in `mountedComponents`
 * `mountedComponents` are unmount after each test
 * This avoid those components to be rerendered during the next state and call xhr mock of other tests
 *
 * After each `TestRenderer.create(component)` there is `TestRenderer.create(null)`
 * without this, `useEffect` of custom hook is not called
 */

const global: any = window;
const nativeXhr = global.XMLHttpRequest;

describe('Fetch', () => {
  const mountedComponents: TestRenderer.ReactTestRenderer[] = [];

  afterEach(() => {
    flushMountedComponents(mountedComponents);
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

    mountedComponents.push(TestRenderer.create(fetchElement));
    TestRenderer.create(null);

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

    mountedComponents.push(TestRenderer.create(firstFetchElement));
    mountedComponents.push(TestRenderer.create(secondFetchElement));
    TestRenderer.create(null);

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

      mountedComponents.push(TestRenderer.create(firstFetchElement));
      TestRenderer.create(null);
      setTimeout(() => {
        mountedComponents.push(TestRenderer.create(secondFetchElement));
        TestRenderer.create(null);

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

      mountedComponents.push(TestRenderer.create(firstFetchElement));
      TestRenderer.create(null);
      setTimeout(() => {
        mountedComponents.push(TestRenderer.create(secondFetchElement));
        TestRenderer.create(null);

        expect(xhrInstance.open.mock.calls.length).toBe(1);
        expect(xhrInstance.send.mock.calls.length).toBe(1);
        resolve();
      }, secondFetchDelay);
    });
  });

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

      mountedComponents.push(TestRenderer.create(firstFetchElement));
      TestRenderer.create(null);
      setTimeout(() => {
        mountedComponents.push(TestRenderer.create(secondFetchElement));
        TestRenderer.create(null);

        expect(xhrInstance.open.mock.calls.length).toBe(1);
        expect(xhrInstance.send.mock.calls.length).toBe(1);
        resolve();
      }, secondFetchDelay);
    });
  });

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

      mountedComponents.push(TestRenderer.create(firstFetchElement));
      TestRenderer.create(null);
      setTimeout(() => {
        mountedComponents.push(TestRenderer.create(secondFetchElement));
        TestRenderer.create(null);

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

      mountedComponents.push(TestRenderer.create(firstFetchElement));
      TestRenderer.create(null);
      setTimeout(() => {
        mountedComponents.push(TestRenderer.create(secondFetchElement));
        TestRenderer.create(null);

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
      TestRenderer.create(null);

      setTimeout(() => {
        firstFetch.unmount();

        expect(xhrInstance.open.mock.calls.length).toBe(1);
        expect(xhrInstance.send.mock.calls.length).toBe(1);
        expect(xhrInstance.abort.mock.calls.length).toBe(1);
        resolve();
      }, unmountDelay);
    });
  });

  test("Don't abort request when abortOnUnmount is disabled", () => {
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
      TestRenderer.create(null);

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
      mountedComponents.push(TestRenderer.create(secondFetchElement));
      TestRenderer.create(null);

      setTimeout(() => {
        firstFetch.unmount();

        expect(xhrInstance.open.mock.calls.length).toBe(1);
        expect(xhrInstance.send.mock.calls.length).toBe(1);
        expect(xhrInstance.abort.mock.calls.length).toBe(0);
        resolve();
      }, unmountDelay);
    });
  });

  test('Don\'t send a request when preventRequest is enabled', () => {
    const xhrMock = createXhrMock({});
    const xhrInstance = new xhrMock();
    global.XMLHttpRequest = jest.fn(() => xhrInstance) as any;

    const fetchElement = createElement(Fetch, {
      url: 'http://fake-url.com',
      fetchPolicy: 'cache-first' as FetchPolicy,
      children: () => createElement('div'),
      loaderDelay: 0,
      withProgress: false,
      preventRequest: true,
    });

    mountedComponents.push(TestRenderer.create(fetchElement));
    TestRenderer.create(null);

    expect(xhrInstance.open.mock.calls.length).toBe(0);
    expect(xhrInstance.send.mock.calls.length).toBe(0);
  });

  test('Abort request when preventRequest is enabled during loading', () => {
    return new Promise(resolve => {
      const loadingDuration = 100;
      const updateDelay = 20;
      const xhrMock = createXhrMock({ duration: loadingDuration });
      const xhrInstance = new xhrMock();
      global.XMLHttpRequest = jest.fn(() => xhrInstance) as any;

      const fetchElement = createElement(Fetch, {
        url: 'http://fake-url.com',
        fetchPolicy: 'cache-first' as FetchPolicy,
        children: () => createElement('div'),
        loaderDelay: 0,
        withProgress: false,
      });
      const preventedFetchElement = createElement(Fetch, {
        url: 'http://fake-url.com',
        fetchPolicy: 'cache-first' as FetchPolicy,
        children: () => createElement('div'),
        loaderDelay: 0,
        withProgress: false,
        preventRequest: true,
      });

      const renderedFetch = TestRenderer.create(fetchElement);
      mountedComponents.push(renderedFetch);
      TestRenderer.create(null);

      setTimeout(() => {
        renderedFetch.update(preventedFetchElement);
        TestRenderer.create(null);

        expect(xhrInstance.open.mock.calls.length).toBe(1);
        expect(xhrInstance.send.mock.calls.length).toBe(1);
        expect(xhrInstance.abort.mock.calls.length).toBe(1);
        resolve();
      }, updateDelay);
    });
  });

  test('Call onSuccess', () => {
    return new Promise(resolve => {
      const xhrMock = createXhrMock({});
      const xhrInstance = new xhrMock();
      global.XMLHttpRequest = jest.fn(() => xhrInstance) as any;
      const onSuccessMock = jest.fn();
      const onErrorMock = jest.fn();

      const fetchElement = createElement(Fetch, {
        url: 'http://fake-url.com',
        fetchPolicy: 'cache-first' as FetchPolicy,
        children: () => createElement('div'),
        loaderDelay: 0,
        withProgress: false,
        onSuccess: onSuccessMock,
        onError: onErrorMock,
      });

      mountedComponents.push(TestRenderer.create(fetchElement));
      TestRenderer.create(null);

      setTimeout(() => {
        expect(xhrInstance.open.mock.calls.length).toBe(1);
        expect(xhrInstance.send.mock.calls.length).toBe(1);
        expect(onSuccessMock.mock.calls.length).toBe(1);
        expect(onErrorMock.mock.calls.length).toBe(0);

        resolve();
      }, 20);
    });
  });

  test('Call onError', () => {
    return new Promise(resolve => {
      const xhrMock = createXhrMock({ willFail: true });
      const xhrInstance = new xhrMock();
      global.XMLHttpRequest = jest.fn(() => xhrInstance) as any;
      const onSuccessMock = jest.fn();
      const onErrorMock = jest.fn();

      const fetchElement = createElement(Fetch, {
        url: 'http://fake-url.com',
        fetchPolicy: 'cache-first' as FetchPolicy,
        children: () => createElement('div'),
        loaderDelay: 0,
        withProgress: false,
        onSuccess: onSuccessMock,
        onError: onErrorMock,
      });

      mountedComponents.push(TestRenderer.create(fetchElement));
      TestRenderer.create(null);

      setTimeout(() => {
        expect(xhrInstance.open.mock.calls.length).toBe(1);
        expect(xhrInstance.send.mock.calls.length).toBe(1);
        expect(onSuccessMock.mock.calls.length).toBe(0);
        expect(onErrorMock.mock.calls.length).toBe(1);

        resolve();
      }, 20);
    });
  });

  test('Call onSuccess even after component unmount', () => {
    return new Promise(resolve => {
      const loadingDuration = 100;
      const unmountDelay = 20;
      const xhrMock = createXhrMock({ duration: loadingDuration });
      const xhrInstance = new xhrMock();
      global.XMLHttpRequest = jest.fn(() => xhrInstance) as any;
      const onSuccessMock = jest.fn();
      const onErrorMock = jest.fn();

      const firstFetchElement = createElement(Fetch, {
        url: 'http://fake-url.com',
        fetchPolicy: 'cache-first' as FetchPolicy,
        children: () => createElement('div'),
        loaderDelay: 0,
        withProgress: false,
        abortOnUnmount: false,
        onSuccess: onSuccessMock,
        onError: onErrorMock,
      });

      const firstFetch = TestRenderer.create(firstFetchElement);
      TestRenderer.create(null);

      setTimeout(() => {
        firstFetch.unmount();
      }, unmountDelay);

      setTimeout(() => {
        expect(xhrInstance.open.mock.calls.length).toBe(1);
        expect(xhrInstance.send.mock.calls.length).toBe(1);
        expect(xhrInstance.abort.mock.calls.length).toBe(0);
        expect(onSuccessMock.mock.calls.length).toBe(1);
        expect(onErrorMock.mock.calls.length).toBe(0);

        resolve();
      }, loadingDuration + 20);
    });
  });

  test('Call onError even after component unmount', () => {
    return new Promise(resolve => {
      const loadingDuration = 100;
      const unmountDelay = 20;
      const xhrMock = createXhrMock({ duration: loadingDuration, willFail: true });
      const xhrInstance = new xhrMock();
      global.XMLHttpRequest = jest.fn(() => xhrInstance) as any;
      const onSuccessMock = jest.fn();
      const onErrorMock = jest.fn();

      const firstFetchElement = createElement(Fetch, {
        url: 'http://fake-url.com',
        fetchPolicy: 'cache-first' as FetchPolicy,
        children: () => createElement('div'),
        loaderDelay: 0,
        withProgress: false,
        abortOnUnmount: false,
        onSuccess: onSuccessMock,
        onError: onErrorMock,
      });

      const firstFetch = TestRenderer.create(firstFetchElement);
      TestRenderer.create(null);

      setTimeout(() => {
        firstFetch.unmount();
      }, unmountDelay);

      setTimeout(() => {
        expect(xhrInstance.open.mock.calls.length).toBe(1);
        expect(xhrInstance.send.mock.calls.length).toBe(1);
        expect(xhrInstance.abort.mock.calls.length).toBe(0);
        expect(onSuccessMock.mock.calls.length).toBe(0);
        expect(onErrorMock.mock.calls.length).toBe(1);

        resolve();
      }, loadingDuration + 20);
    });
  });
});
