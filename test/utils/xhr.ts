interface XhrMockOptions {
  duration?: number;
  willFail?: boolean;
  response?: string;
  responseStatus?: number;
}

function createXhrMock({
  duration = 0,
  willFail = false,
  response = '{}',
  responseStatus = 200,
}: XhrMockOptions) {
  return class XMLHttpRequest {
    status = 0;
    readyState = 0;
    response = '';
    onload = () => undefined;
    onerror = () => undefined;
    onprogress = () => undefined;

    open = jest.fn(() => (this.readyState = 1));

    send = jest.fn(() => {
      this.readyState = 3;

      setTimeout(() => {
        const wasAborted = this.readyState === 0;
        if (!wasAborted) {
          if (willFail) {
            this.onerror();
          } else {
            this.response = response;
            this.status = responseStatus;
            this.onload();
          }
        }
      }, duration);
    });

    abort = jest.fn(() => {
      this.readyState = 0;
    });
  };
}

export { createXhrMock };
