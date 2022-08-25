/**
 * reactive: 创建响应对象
 * 关注点：什么时候触发 getter 什么时候触发 setter
 * getter: 访问响应对象属性时触发，并会被effect收集依赖
 * setter: 设置响应对象属性的值，并会释放依赖 调用effect fn
 */
import { reactive } from "../reactive";

describe("reactive", () => {
  it("happy path", () => {
    const original = {
      foo: 10,
    };

    const observed = reactive(original);
    expect(observed).not.toBe(original);
    expect(observed.foo).toBe(10);
  });
});
