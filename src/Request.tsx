import { ReactElement } from 'react';
import useRequest, { UseRequestOptions, ChildrenParams } from './useRequest';

interface Props<T> extends UseRequestOptions<T> {
  children: (params: ChildrenParams<T>) => ReactElement;
}

function Request<T>({ children, ...props }: Props<T>) {
  const request = useRequest(props);

  return children(request);
}

export default Request;
