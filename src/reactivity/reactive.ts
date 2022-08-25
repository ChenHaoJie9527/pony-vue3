import { track } from "./effect";
export function reactive(raw) {
  return new Proxy(raw, {
    get(target, key) {
      // {foo: 10}
      // Reflect 弱引用
      const res = Reflect.get(target, key);
      // TODO 依赖收集
      track(target, key);
      return res;
    },
    set(target, key, value) {
      const res = Reflect.set(target, key, value);
      // TODO 触发依赖
      return res;
    },
  });
}
