# pony-vue3
基于Vue3源码学习

概念：使用 Jest 代码调试，通过 TDD 思想 驱动，学习Vue3核心思想。

## 1. reactivity

Vue3 响应式核心，对数据进行 getter 和 setter，依赖收集和触发依赖的操作

涉及功能：

- `reactive` 创建响应式对象

  1. getter 对响应式对象 property 访问

      每个 响应式对象 自身都有一个收集依赖的容器 dep，当对响应对象进行访问时，会被 effect 捕获，将依赖收集起来，实际上这个依赖就是传给 effect 的函数。

  2. setter 对响应式对象 property 设置

     当对响应对象进行修改时，就会拿出 dep 容器里所有的依赖执行

- `effect`

  1. init 初始化
  2. getter 收集依赖
  3. setter 触发依赖
