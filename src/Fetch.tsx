import { ReactElement } from 'react';
import useFetch, { FetchOptions, ChildrenParams } from './useFetch';

interface Props<T> extends FetchOptions<T> {
  children: (params: ChildrenParams<T>) => ReactElement;
}

function Fetch<T>({ children, ...props }: Props<T>) {
  const request = useFetch(props);

  return children(request);
}

export default Fetch;
