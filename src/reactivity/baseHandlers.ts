import { track, trigger } from "./effect";

// 性能优化：缓存一次，多次使用
const get = createGetter();
const set = createSetter();
const readonlyGet = createGetter(true);

// 封装 proxy - 选项
export const mutableHandles = {
  get,
  set,
};

// 封装 readonly proxy - 选项
export const readonlyHandles = {
  get: readonlyGet,
  set(target, key, value) {
    return true;
  },
};

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

// 创建 setter 函数
function createSetter() {
  return (target, key, value) => {
    const res = Reflect.set(target, key, value);
    // TODO 触发依赖
    trigger(target, key);
    return res;
  };
}
