import { track, trigger } from "./effect";
import { REACTIVE_FLAGS } from "./reactive";

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
    console.warn("警告：该对象为只读，不可 set!");
    return true;
  },
};

// 创建 getter 函数
function createGetter(isReadonly = false) {
  return (target, key) => {
    // 针对 isReactive情况，如果访问的代理对象的某个属性，那么会返回 true
    if (key === REACTIVE_FLAGS.IS_REACTIVE) {
      return !isReadonly;
    }
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
