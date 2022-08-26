class ReactiveEffect {
  private _fn: any;
  constructor(fn) {
    this._fn = fn;
  }
  run() {
    activeEffect = this;
    this._fn();
  }
}
let activeEffect;
export function effect(fn) {
  const _effect = new ReactiveEffect(fn);
  _effect.run();
}

let targetMaps = new Map();
/**
 * @param target 依赖收集对象
 * @param key 依赖收集对象的eky
 * 对象里的key 需要有一个容器 用于收集依赖
 * 关系：target => key => dep
 */
export function track(target, key) {
  let depMaps = targetMaps.get(target);
  /**
   * effect 初始化时，depMaps 为空
   * effect 初始化时，dep 为空
   */
  if (!depMaps) {
    depMaps = new Map();
    targetMaps.set(target, depMaps); // 建立映射关系
  }

  let dep = depMaps.get(key); // 取出 key 对应的 容器

  if (!dep) {
    dep = new Set();
    depMaps.set(key, dep); // key => dep 即每一个 key 对应 dep容器
  }
  dep.add(activeEffect);
}

export function trigger(target, key) {
  const depsMap = targetMaps.get(target);
  const deps = depsMap.get(key);
  for (const effect of deps) {
    effect.run();
  }
}
