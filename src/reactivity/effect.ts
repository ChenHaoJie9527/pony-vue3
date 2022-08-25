class ReactiveEffect {
  private _fn;
  constructor(fn) {
    this._fn = fn;
  }
  run() {
    this._fn();
  }
}

export function effect(fn) {
    const _effect = new ReactiveEffect(fn);

    // effect 初始化执行 fn
    _effect.run();
}
