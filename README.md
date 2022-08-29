# pony-vue3
基于Vue3源码学习

概念：使用 `Jest` 单元测试，通过 `TDD` 思想 驱动，学习Vue3核心思想。

## 1. reactivity

`Vue3` 响应式核心，对数据进行 `getter` 和 `setter`，`effect` 依赖收集和触发依赖的操作

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
