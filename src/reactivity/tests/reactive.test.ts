/**
 * reactive: 创建响应对象
 * 关注点：什么时候触发 getter 什么时候触发 setter
 * getter:
 * setter:
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
