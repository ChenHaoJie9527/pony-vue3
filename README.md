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

