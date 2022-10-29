class ReactiveEffect {
  private fn: Function;
  constructor(_fn) {
    this.fn = _fn;
  }
  run() {
    activeEffect = this;
    this.fn();
  }
}
let activeEffect;
export function effect(fn: Function) {
  const _effectReactive = new ReactiveEffect(fn);
  _effectReactive.run();
}

export function reactive(raw) {
  return new Proxy(raw, {
    get(target, key) {
      const result = Reflect.get(target, key);
      track(target, key);
      return result;
    },
    set(target, key, value) {
      const res = Reflect.set(target, key, value);
      trigger(target, key);
      return res;
    },
  });
}
const targetMap = new Map();
function track(target, key) {
  let depsMap = targetMap.get(target);
  if (!depsMap) {
    depsMap = new Map();
    targetMap.set(target, depsMap);
  }

  let dep = depsMap.get(key);
  if (!dep) {
    dep = new Set();
    depsMap.set(key, dep);
  }
  dep.add(activeEffect);
}

function trigger(target, key) {
  let depsMap = targetMap.get(target);
  let dep = depsMap.get(key);
  for (const effect of dep) {
    effect.run();
  }
}
