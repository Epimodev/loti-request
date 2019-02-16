import { createElement, ReactElement } from 'react';
import * as TestRenderer from 'react-test-renderer';
import Request from '../src/Request';
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
    global.XMLHttpRequest = nativeXhr;
  });

  test("Don't open request when component is just render", () => {
    const xhrMock = createXhrMock({});
    const xhrInstance = new xhrMock();
    global.XMLHttpRequest = jest.fn(() => xhrInstance) as any;

    const requestElement = createElement(Request, {
      url: 'http://fake-url.com',
      children: () => createElement('div'),
      loaderDelay: 0,
      withProgress: false,
    });

    mountedComponents.push(TestRenderer.create(requestElement));
    TestRenderer.create(null);

    expect(xhrInstance.open.mock.calls.length).toBe(0);
    expect(xhrInstance.send.mock.calls.length).toBe(0);
  });

  test('Open and send request when fetch is called', () => {
    const xhrMock = createXhrMock({});
    const xhrInstance = new xhrMock();
    global.XMLHttpRequest = jest.fn(() => xhrInstance) as any;

    const requestElement = createElement(Request, {
      url: 'http://fake-url.com',
      children: ({ fetch }: any) => createElement('button', { onClick: () => fetch() }),
      loaderDelay: 0,
      withProgress: false,
    });

    const request = TestRenderer.create(requestElement);
    mountedComponents.push(request);
    TestRenderer.create(null);

    const button = request.root.findByType('button');
    button.props.onClick();

    expect(xhrInstance.open.mock.calls.length).toBe(1);
    expect(xhrInstance.send.mock.calls.length).toBe(1);
  });

  test('Abort request when fetch is unmount before load end', () => {
    return new Promise(resolve => {
      const loadingDuration = 100;
      const unmountDelay = 20;
      const xhrMock = createXhrMock({ duration: loadingDuration });
      const xhrInstance = new xhrMock();
      global.XMLHttpRequest = jest.fn(() => xhrInstance) as any;

      const firstRequestElement = createElement(Request, {
        url: 'http://fake-url.com',
        children: ({ fetch }: any) => createElement('button', { onClick: () => fetch() }),
        loaderDelay: 0,
        withProgress: false,
      });

      const request = TestRenderer.create(firstRequestElement);
      TestRenderer.create(null);

      const button = request.root.findByType('button');
      button.props.onClick();

      setTimeout(() => {
        request.unmount();

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

      const firstRequestElement = createElement(Request, {
        url: 'http://fake-url.com',
        children: ({ fetch }: any) => createElement('button', { onClick: () => fetch() }),
        loaderDelay: 0,
        withProgress: false,
        abortOnUnmount: false,
      });

      const request = TestRenderer.create(firstRequestElement);
      TestRenderer.create(null);

      const button = request.root.findByType('button');
      button.props.onClick();

      setTimeout(() => {
        request.unmount();

        expect(xhrInstance.open.mock.calls.length).toBe(1);
        expect(xhrInstance.send.mock.calls.length).toBe(1);
        expect(xhrInstance.abort.mock.calls.length).toBe(0);
        resolve();
      }, unmountDelay);
    });
  });

  test('Call onSuccess', () => {
    return new Promise(resolve => {
      const xhrMock = createXhrMock({});
      const xhrInstance = new xhrMock();
      global.XMLHttpRequest = jest.fn(() => xhrInstance) as any;
      const onSuccessMock = jest.fn();
      const onErrorMock = jest.fn();

      const requestElement = createElement(Request, {
        url: 'http://fake-url.com',
        children: ({ fetch }: any) => createElement('button', { onClick: () => fetch() }),
        loaderDelay: 0,
        withProgress: false,
        onSuccess: onSuccessMock,
        onError: onErrorMock,
      });

      const request = TestRenderer.create(requestElement);
      mountedComponents.push(request);
      TestRenderer.create(null);

      const button = request.root.findByType('button');
      button.props.onClick();

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

      const requestElement = createElement(Request, {
        url: 'http://fake-url.com',
        children: ({ fetch }: any) => createElement('button', { onClick: () => fetch() }),
        loaderDelay: 0,
        withProgress: false,
        onSuccess: onSuccessMock,
        onError: onErrorMock,
      });

      const request = TestRenderer.create(requestElement);
      mountedComponents.push(request);
      TestRenderer.create(null);

      const button = request.root.findByType('button');
      button.props.onClick();

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

      const requestElement = createElement(Request, {
        url: 'http://fake-url.com',
        children: ({ fetch }: any) => createElement('button', { onClick: () => fetch() }),
        loaderDelay: 0,
        withProgress: false,
        abortOnUnmount: false,
        onSuccess: onSuccessMock,
        onError: onErrorMock,
      });

      const request = TestRenderer.create(requestElement);
      TestRenderer.create(null);

      const button = request.root.findByType('button');
      button.props.onClick();

      setTimeout(() => {
        request.unmount();
      }, unmountDelay);

      setTimeout(() => {
        expect(xhrInstance.open.mock.calls.length).toBe(1);
        expect(xhrInstance.send.mock.calls.length).toBe(1);
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

      const requestElement = createElement(Request, {
        url: 'http://fake-url.com',
        children: ({ fetch }: any) => createElement('button', { onClick: () => fetch() }),
        loaderDelay: 0,
        withProgress: false,
        abortOnUnmount: false,
        onSuccess: onSuccessMock,
        onError: onErrorMock,
      });

      const request = TestRenderer.create(requestElement);
      TestRenderer.create(null);

      const button = request.root.findByType('button');
      button.props.onClick();

      setTimeout(() => {
        request.unmount();
      }, unmountDelay);

      setTimeout(() => {
        expect(xhrInstance.open.mock.calls.length).toBe(1);
        expect(xhrInstance.send.mock.calls.length).toBe(1);
        expect(onSuccessMock.mock.calls.length).toBe(0);
        expect(onErrorMock.mock.calls.length).toBe(1);

        resolve();
      }, loadingDuration + 20);
    });
  });

  test('Throw an error if we try to fetch without url', () => {
    const xhrMock = createXhrMock({});
    const xhrInstance = new xhrMock();
    global.XMLHttpRequest = jest.fn(() => xhrInstance) as any;

    const requestElement = createElement(Request, {
      children: ({ fetch }: any) => createElement('button', { onClick: () => fetch() }),
      loaderDelay: 0,
      withProgress: false,
    });

    const request = TestRenderer.create(requestElement);
    mountedComponents.push(request);
    TestRenderer.create(null);

    const button = request.root.findByType('button');

    const sendRequest = () => {
      button.props.onClick();
    };

    expect(sendRequest).toThrowError(/url/);
  });
});
