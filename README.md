# pony-vue3
基于Vue3源码学习

概念：使用 `Jest` 单元测试，通过 `TDD` 思想 驱动，学习Vue3核心思想。

主要功能：

[TOC]

## 1. reactivity

`Vue3` 响应式核心，对数据进行 `getter` 和 `setter`，`effect` 依赖收集和触发依赖的操作，并对外提供许多方法，可以单独作为一个库使用。

例子：

```ts
import { reactive } from "../reactive";
import { effect } from "../effect";
describe("effect", () => {
  it("happy path", () => {
    const user = reactive({
      foo: 10,
    });
    let nextAge;
    effect(() => {
      nextAge = user.foo + 1;
    });

    expect(nextAge).toBe(11);

    // update 更新响应对象值
    user.foo++;
    expect(nextAge).toBe(12);
  });
});
```

涉及功能：

- `reactive` 创建响应式对象

  1. `getter` 对响应式对象 `property` 访问

      每个 响应式对象 自身都有一个收集依赖的容器 dep，当对响应对象进行访问时，会被 `effect` 捕获，将依赖收集起来，实际上这个依赖就是传给 effect 的函数。

  2. `setter` 对响应式对象 `property` 设置

     当对响应对象进行修改时，就会拿出 dep 容器里所有的依赖执行

- `effect`

  1. `init` 初始化

     effect 初始化时，执行 该方法的回调函数 fn

  2. `getter` 收集依赖

     当 回调函数 fn 里有访问 响应对象属性时，会触发 getter 进行 依赖收集，通过 track 收集对应 的 target 和 key，每一个 key 对应每一个容器 deps

  3. `setter` 触发依赖

     当更新响应对象的值时，会先触发 getter 进行依赖收集，通过 track收集依赖存储到 deps容器里，然后触发更新操作 setter，tirgger实现更新，会将存储在 deps 里的依赖取出来，触发 fn.call() 操作，更新对应的值

### 1.1 创建 reactive 代理对象

```ts
export function reactive(raw) {
  return new Proxy(raw, {
    get(target, key) {
      // {foo: 10}
      // Reflect 弱引用
      const res = Reflect.get(target, key);
      // TODO 依赖收集
      return res;
    },
    set(target, key, value) {
      const res = Reflect.set(target, key, value);
      // TODO 触发依赖
      return res;
    },
  });
}
```

### 1.2 effect 实现依赖收集和触发依赖

1. 初始化时，`effect` 触发回调 执行`副作用函数`里的逻辑，访问 `user.foo`  `getter` 触发依赖收集  `track` 

   ```ts
   new Proxy(raw, {
           get(target, key) {
               const res = Reflect.get(target, key);
               //TODO: getter 依赖收集
               track(target, key)
               return res;
           },
           set(target, key, value) {
               const res = Reflect.set(target, key, value);
               // TODO: setter 触发依赖
               trigger(target, key)
               return res;
           }
       });
   ```

   

2. `track` 依赖收集函数

   ```ts
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
   ```

   依赖收集存在一定的映射关系，即

   - `target => key => dep` 即代理对象里的每一个 `key` 都有一个独一无二的 容器 `dep` 用于在 getter 触发时，收集依赖，而依赖则是 `effect` 里的 `fn副作用函数`
   - 每一个 key 对应的 `dep` 容器是独一无二的，通过 `new Set()` 实现唯一性

3. `trigger` 触发依赖

   ```ts
   /**
    * @param target 依赖收集对象
    * @param key 依赖收集对象的eky
    * target => key => dep 即通过 target 取出 key 对应的 dep ，dep 里收集了依赖会被循环触发调用 fn.call() 
    */
   export function trigger(target, key) {
     const depsMap = targetMaps.get(target);
     const deps = depsMap.get(key);
     for (const effect of deps) {
       effect.run();
     }
   }
   ```

   触发依赖，主要是在更新 响应对象值时，会触发 `setter` 操作，遍历 `deps` 容器里的依赖并触发。

   主要是如何触发的：

   1. 通过 `target` 查找对应的 `depsMap` 集合，即 `target => depsMap`
   2. 每一个 `depsMap` 集合里的 `key` 对应 `set` 集合，遍历 `set` 集合找到每一个 依赖项，调用依赖项里的 `run` 方法，即调用 `effect` 里的 `副作用函数`，触发更新值。

### 1.3 effect 返回值

引述：调用 effect 会返回一个 函数，当手动调用返回的这个函数时，会再次触发 effect 副作用函数

**Tasking**：

- [x] `effect(fn) => function(runner)`，即调用 `effect` 会返回一个 `runner` 函数
- [x] 当调用 `runner` 函数时，会再次执行 `effect(fn)` 的 `fn` 副作用函数
- [x] 当调用 `fn` 时，会将 `fn` 副作用函数的返回值 `return` 出去，即调用 `runner` 函数 会得到 `fn` 的返回值

完成下面测试：

```ts
let foo = 10;
const runner = effect(() => {
    foo++;
    return "foo"
});
// 验证 fn 是否执行
expect(foo).toBe(11);
// 验证 fn 是否执行
const res = runner();
expect(foo).toBe(12);
//验证 fn 返回值
expect(res).toBe('foo');
```

只需要在  effect 里将 run 方法 return 出去即可：

```ts
class ReactiveEffect {
  private _fn;
  constructor(fn) {
    this._fn = fn;
  }
  run() {
    activeEffect = this;
    return this._fn();
  }
}
export function effect(fn) {
  const _effect = new ReactiveEffect(fn);

  // effect 初始化执行 fn
  _effect.run();
  // 将 run 方法返回出去 允许被调用
  return _effect.run.bind(_effect);
}
```

### 1.4 effect 的 scheduler 功能

**引述**：effect 方法 除了接收第一个参数为函数类型之外，还可以接受第二个可选参数。

**Tasking:**

- [x] 通过 `effect` 的第二个参数给定一个 `scheduler` 的  `fn` 函数
- [x] `effect` 第一次执行的时候，还会执行 `fn` 函数
- [x] 当 响应式对象 `set` `update` ，不会执行 `effect` 的第一个参数 `fn` 副作用函数，而是执行 `scheduler`
- [x] 通过调用 `effect` 返回 `runner` 函数时，如果调用 `runner` 函数，会再次执行 `fn`

实现下列单元测试：

```ts
it('scheduler', () => {
    let dummy;
    let run;
    // 创建一个函数
    const scheduler = jest.fn(() => {
      run = runner;
    });
    const _object = reactive({
      foo: 10,
    });
    const runner = effect(
      () => {
        dummy = _object.foo;
      },
      { scheduler }
    );
    // 断言 scheduler 从未被调用过
    expect(scheduler).not.toHaveBeenCalled();
    // effect 初始化时，fn 被调用，dummy = 10
    expect(dummy).toBe(10);

    // // 更新 响应对象的值
    _object.foo++;
    // // 断言 scheduler 被调用 1 次
    expect(scheduler).toHaveBeenCalledTimes(1);
    // 断言 是 10 因为 此时不会执行 fn，而是执行 scheduler
    expect(dummy).toBe(10);
    // // 调用 run ，因为响应式对象值更新后，effect会执行 scheduler，在scheduler中将 effect的返回值赋值给 run，调用 run 相当于调用 fn
    run();
    // // 通过前面 run调用，执行了 fn，将最新的值赋值给 dummy
    expect(dummy).toBe(11);
})
```

要实现上面的单元通过，需要对 `effect` 进行调整：

1. 允许支持传入 第二个参数；
2. 在 `setter` 时， `update` 响应对象，对 trigger 进行判断 当传递了 `schedluer` 时，执行 `schedluer` ，否则执行 `run` 方法

```ts
class ReactiveEffect {
  private _fn;
    // 支持接收第二个参数
  constructor(fn, public scheduler?: any) {
    this._fn = fn;
  }
  run() {
    activeEffect = this;
    return this._fn();
  }
}
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
export function effect(fn, options: any = {}) {
  const { scheduler } = options;
  const _effect = new ReactiveEffect(fn, scheduler);

  // effect 初始化执行 fn
  _effect.run();
  // 将 run 方法返回出去 允许被调用
  return _effect.run.bind(_effect);
}
```

### 1.5 effect 的 stop 功能

**引述**：调用 `stop` 方法，会停止 `effect` 的 副作用函数调用，即 `effect` 不会触发 依赖更新。

**实现思路**：在对响应式对象进行 `update` 时，会触发依赖更新，在 `trigger` 中 遍历收集到的 `deps`，并调用 `fn` 依赖。所以，在调用  `stop` 时，清空掉收集到的 依赖，就不会触发更新。

**Tasking**:

- [x] 在 `effect` 中实现 `stop` 方法，接收 一个参数 `runner

  ```ts
  // effect.ts
  // stop 方法
  export function stop(runner) {
    
  }
  ```

- [x] 实现 `ReactiveEffect` 类方法 `stop`，类中声明`deps`属性，用于收集 `dep` 容器

  ```ts
  class ReactiveEffect {
    private _fn;
    public deps: any[] = [];
    constructor(fn, public scheduler?: any) {
      this._fn = fn;
    }
    run() {
      activeEffect = this;
      return this._fn();
    }
    stop() {
      
    });
    }
  }
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
    // 收集依赖
    dep.add(activeEffect);
    // 收集容器
    activeEffect.deps.push(dep);
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
  ```

- [x] 在 `stop` 方法中调用 `effect` 实例的 `stop`方法

  ```ts
  // stop 方法
  export function stop(runner) {
    runner.effect.stop();
  }
  ```

- [x] 遍历 deps，清空 dep 容器

  ```ts
  class ReactiveEffect {
    private _fn;
    public deps: any[] = [];
    constructor(fn, public scheduler?: any) {
      this._fn = fn;
    }
    run() {
      activeEffect = this;
      return this._fn();
    }
    stop() {
      // 删除 deps 里的 effect
      clearDepEffect(this);
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
  ```

### 1.6 effect 的 onStop 功能

**引述**：通过给定 `effect` 第二个参数 `onStop` 选项时，当手动 调用 `stop` 函数后，传入 `effect` 返回的 `runner` 函数，那么此时 `onStop` 会被执行。即调用 `sotp` 后，执行 `onStop` 回调函数。

**Tasking**：

- [x] effect 类声明可选方法 onStop，用于在 stop中执行

  ```tsx
  class ReactiveEffect {
    private _fn;
    public deps: any[] = [];
    active: boolean = true;
    onStop?: () => void;
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
        if (this.onStop) {
          this.onStop();
        }
        this.active = false;
      }
    }
  }
  ```

- [x] 合并 options 选项 到 effect 中

  ```tsx
  let activeEffect; // 全局变量 用于获取effect的fn
  export function effect(fn, options: any = {}) {
    const { scheduler } = options;
    const _effect = new ReactiveEffect(fn, scheduler);
    extend(_effect, options);
    // effect 初始化执行 fn
    _effect.run();
    // 将 run 方法返回出去 允许被调用
    const runner: any = _effect.run.bind(_effect);
    // 挂载实例
    runner.effect = _effect;
  
    return runner;
  }
  
  // sharded/index.ts
  export extend = Object.assign
  ```

- [x] 单元测试通过

  ```ts
  it("onStop", () => {
      const _object = reactive({
        foo: 10,
      });
      let count;
      const onStop = jest.fn(() => {
        count = _object.foo + 1;
      });
      let dummy;
      const runner = effect(
        () => {
          dummy = _object.foo;
        },
        { onStop }
      );
      expect(onStop).not.toHaveBeenCalled();
      expect(dummy).toBe(10);
      stop(runner);
      expect(count).toBe(11)
      expect(onStop).toHaveBeenCalledTimes(1);
    });
  ```

### 1.7 reactive 的 readonly 功能

**引述**：`readonly`  是 `reactive` 里的功能，声明一个只读代理对象，不允许被 `setter`，因此不会 `触发依赖`，也不需要做 `依赖收集`

**Tasking**：

- [x] 实现 `readonly` 方法，并导出

  ```tsx
  export function readonly(raw) {
    return new Proxy(raw, {
      get(target, key) {
        const res = Reflect.get(target, key);
        return res;
      },
      set(target, key, value) {
        return true;
      }
    })
  }
  ```

- [x] 通过`happy path` 测试

  ```tsx
  import { readonly } from "../reactive";
  
  describe("happy path", () => {
    it("readonly", () => {
      const _object = {
          foo: 10
      };
      const res = readonly(_object);
      expect(res).not.toBe(_object);
      expect(res.foo).toBe(10);
    });
  });
  ```

### 1.8 reactive - Proxy 的 get，set 封装

1. 封装 get

   ```ts
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
   ```

2. 封装 set

   ```ts
   // 创建 setter 函数
   function createSetter() {
     return (target, key, value) => {
       const res = Reflect.set(target, key, value);
       // TODO 触发依赖
       trigger(target, key);
       return res;
     };
   }
   ```

3. 封装 mutableHandles

   ```tsx
   // 性能优化：缓存一次，多次使用
   const get = createGetter();
   const set = createSetter();
   const readonlyGet = createGetter(true);
   
   // 封装 proxy - 选项
   export const mutableHandles = {
     get,
     set,
   }；
   ```

4. 封装 readonlyHandles

   ```ts
   // 性能优化：缓存一次，多次使用
   const get = createGetter();
   const set = createSetter();
   const readonlyGet = createGetter(true);
   // 封装 readonly proxy - 选项
   export const readonlyHandles = {
     get: readonlyGet,
     set(target, key, value) {
       console.warn('警告：该对象为只读，不可 set!')
       return true;
     },
   };
   ```

5. 重构后的 reactive

   ```ts
   import { mutableHandles, readonlyHandles } from "./baseHandlers";
   export function reactive(raw) {
     return createActiveOption(raw, mutableHandles);
   }
   
   export function readonly(raw) {
     return createActiveOption(raw, readonlyHandles);
   }
   
   function createActiveOption(raw: any, baseHandlers: any) {
     return new Proxy(raw, baseHandlers);
   }
   ```

### 1.9 reactive 的 isReactive 功能

**引述**：通过给定 `isReactive` 方法 传入参数，判断该传递参数是否为 `Proxy` 对象，返回 `Boolean`值

**通过下列测试**:

```tsx
	// 判断当前对象是不是 reactive 代理对象 断言是代理对象
    expect(isReactive(observed)).toBe(true);
    // 断言 不是一个代理对象
    expect(isReactive(original)).toBe(false);
```

**Tasking**：

- [x] 实现 isReactive 方法，接收 target 参数

  ```tsx
  /**
   *
   * @param target: 需要判断的对象
   * 当调用 isReactive 时，会触发 getter 操作，即 proxy 的 get
   */
  export function isReactive(target) {
    return !!target[REACTIVE_FLAGS.IS_REACTIVE];
  }
  ```

- [x] 访问 target 对象的 key，会触发 `Proxy` 的 `getter`，判断当前的 key 是否为 `__reactive_flag`，是则返回 `true`，否则返回 `false`

  ```tsx
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
  ```

### 2.0 reactive 的 isReadonly 功能

**引述**：通过给定 `isReadonly` 方法传递 参数，若该参数 是一个 `readonly` 对象，则返回 `true`，否则返回 `false`

**思路**：通过访问 Target 对象 的 key，会触发 getter ，判断当前 flag 是否相等，若相等，则返回当前传递 的 isReadonly

**通过下列测试**：

```tsx
it("isReadonly", () => {
    const user = readonly({ foo: 10 });
    // 断言 user 是 readonly 对象
    expect(isReadonly(user)).toBe(true);
    // 断言 不是 readonly 对象
    expect(isReadonly({ foo: 10 })).toBe(false);
  });
```

**Tasking**：

- [x] 实现 isReadonly 方法，接收 target 参数，表示当前需要判断的对象

  ```tsx
  /**
   * 
   * @param target: 需要判断的对象
   * 当调用 isReadonly时，会触发 getter 操作，即 proxy 的 get
   */
  export function isReadonly(target) {
    
  }
  ```

- [x] 通过访问 target 的 key，触发proxy 的 getter

  ```tsx
  /**
   * 
   * @param target: 需要判断的对象
   * 当调用 isReadonly时，会触发 getter 操作，即 proxy 的 get
   */
  export function isReadonly(target) {
    return !!target[REACTIVE_FLAGS.IS_READONLY]
  }
  ```

- [x] 在proxy 的 getter 里判断当前 flag 与访问的 key 是否一致，一致则返回 isReadonly 的值

  ```tsx
  // 创建 getter 函数
  function createGetter(isReadonly = false) {
    return (target, key) => {
      // 针对 isReactive情况，如果的对象 proxy 对象，那么会返回 true
      if (key === REACTIVE_FLAGS.IS_REACTIVE) {
        return !isReadonly;
      }
      // 针对 isReadonly 情况，如果访问的对象是 readonly 对象，则返回true
      if (key === REACTIVE_FLAGS.IS_READONLY) {
        return isReadonly;
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
  ```

  
