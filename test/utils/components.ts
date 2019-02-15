import * as TestRenderer from 'react-test-renderer';

function flushMountedComponents(components: TestRenderer.ReactTestRenderer[]) {
  while (components.length > 0) {
    const component = components.pop();
    component!.unmount();
  }
}

export { flushMountedComponents };
