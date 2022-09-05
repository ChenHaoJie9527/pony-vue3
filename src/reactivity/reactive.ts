import { track, trigger } from "./effect";

// 创建 getter 函数
function createGetter(isReadonly = false) {
  return (target, key) => {
    // {foo: 10}
    // Reflect 弱引用
    const res = Reflect.get(target, key);
    if (!isReadonly) {
      // TODO 依赖收集
      track(target, key);
    }
    return res;
  };
}

export function reactive(raw) {
  return new Proxy(raw, {
    get: createGetter(),
    set(target, key, value) {
      const res = Reflect.set(target, key, value);
      // TODO 触发依赖
      trigger(target, key);
      return res;
    },
  });
}

export function readonly(raw) {
  return new Proxy(raw, {
    get: createGetter(true),
    set(target, key, value) {
      return true;
    },
  });
}
