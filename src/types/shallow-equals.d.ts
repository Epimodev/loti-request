declare module 'shallow-equal/objects' {
  type shallowEqualObjects = (objA: object, objB: object) => boolean;
  type shallowEqualObjectsExport = shallowEqualObjects & { default: shallowEqualObjects };
  declare const shallowEquals: shallowEqualObjectsExport;
  export = shallowEquals;
  export as namespace shallowEquals;
}

declare module 'shallow-equal/arrays' {
  type shallowEqualArrays = (objA: object, objB: object) => boolean;
  type shallowEqualArraysExport = shallowEqualArrays & { default: shallowEqualArrays };
  declare const shallowEquals: shallowEqualArraysExport;
  export = shallowEquals;
  export as namespace shallowEquals;
}
