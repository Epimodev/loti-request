import { createElement, createContext, Context, ReactNode } from 'react';

type Headers = { [key: string]: string };

interface Props {
  headers?: Headers;
  children: ReactNode;
}

const defaultHeaders = {};

const RequestContext: Context<Headers> = createContext(defaultHeaders);

const RequestProvider = ({ headers = defaultHeaders, children }: Props) => {
  return <RequestContext.Provider value={headers}>{children}</RequestContext.Provider>;
};

export default RequestProvider;
export { RequestContext };
