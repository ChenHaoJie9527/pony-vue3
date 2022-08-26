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



