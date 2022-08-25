let activeEffect; // 全局变量 用于获取effect的fn
class ReactiveEffect {
  private _fn;
  constructor(fn) {
    this._fn = fn;
  }
  run() {
    activeEffect = this;
    this._fn();
  }
}

export function effect(fn) {
  const _effect = new ReactiveEffect(fn);

  // effect 初始化执行 fn
  _effect.run();
}

const targetMap = new Map();
/**
 * getter时 触发依赖收集
 * @param targe 依赖收集对象
 * @param key 依赖收集对象的属性
 * 响应对象里的每一个 key，需要有一个依赖收集的容器，当访问 key 时，容器会收集 effect 里的 fn，并且每个key的依赖收集容器是唯一的
 */
export function track(target, key) {
  // set 结构 数据唯一
  // target => key => dep 每一个key都有一个唯一的容器
  let depsMap = targetMap.get(target);

  // 初始化时，depsMap是为空，所以需要创建 Map
  if (!depsMap) {
    depsMap = new Map();
    targetMap.set(target, depsMap);
  }

  let dep = depsMap.get(key); // 获取 key 对应的 容器
  if (!dep) {
    dep = new Set();
  }
  // 收集依赖
  dep.add(activeEffect);
}
