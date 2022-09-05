class ReactiveEffect {
  private _fn;
  public deps: any[] = [];
  active: boolean = true;
  constructor(fn, public scheduler?: any) {
    this._fn = fn;
  }
  run() {
    this.active = true;
    activeEffect = this;
    return this._fn();
  }
  stop() {
    // 性能优化
    if (this.active) {
      // 删除 deps 里的 effect
      clearDepEffect(this);
      this.active = false;
    }
  }
}

function clearDepEffect(effect) {
  effect.deps.forEach((dep) => {
    // dep 是 Set集合
    const _dep: Set<any> = dep;
    // 删除当前 实例
    _dep.delete(effect);
  });
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
    depsMap.set(key, dep);
  }
  if (!activeEffect) return;
  // 收集依赖
  dep.add(activeEffect);
  // 收集容器
  activeEffect.deps.push(dep);
}

/**
 *
 * @param target 依赖对象
 * @param key 依赖对象的key
 * 基于当前的 target 和 key，取出对应的 dep 容器
 */
export function trigger(target, key) {
  let depsMap = targetMap.get(target);
  let deps = depsMap.get(key); // 取出 key 对应的 容器

  for (const effect of deps) {
    // 当 存在 options 选项时，就要触发 scheduler 而不是 run
    if (effect.scheduler) {
      effect.scheduler();
    } else {
      // 初始化时会触发 run 方法
      effect.run();
    }
  }
}

let activeEffect; // 全局变量 用于获取effect的fn
export function effect(fn, options: any = {}) {
  const { scheduler } = options;
  const _effect = new ReactiveEffect(fn, scheduler);

  // effect 初始化执行 fn
  _effect.run();
  // 将 run 方法返回出去 允许被调用
  const runner: any = _effect.run.bind(_effect);
  // 挂载实例
  runner.effect = _effect;

  return runner;
}

// stop 方法
export function stop(runner) {
  runner.effect.stop();
}
