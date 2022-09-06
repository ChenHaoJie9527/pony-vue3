import { isReadonly, readonly } from "../reactive";

describe("readonly", () => {
  it("happy path", () => {
    const _object = {
      foo: 10,
    };
    const res = readonly(_object);
    expect(res).not.toBe(_object);
    expect(res.foo).toBe(10);
  });

  it("warning then call set", () => {
    // 创建一个可监听函数
    console.warn = jest.fn();
    const user = readonly({ foo: 10 });
    // 触发依赖更新时，就会触发警告，不允许更新
    user.foo = 11;
    expect(console.warn).toBeCalled();
  });
  it("isReadonly", () => {
    const user = readonly({ foo: 10 });
    // 断言 user 是 readonly 对象
    expect(isReadonly(user)).toBe(true);
    // 断言 不是 readonly 对象
    expect(isReadonly({ foo: 10 })).toBe(false);
  });
});
