import { reactive, effect } from "./index";
describe("should test", () => {
  it("test reactive", () => {
    const params = { foo: 10 };
    const _params = reactive({ foo: 10 });
    expect(_params).not.toBe(params);

    let _value;
    effect(() => {
      _value = _params.foo + 1;
    });

    expect(_value).toBe(11);

    _params.foo++;
    expect(_value).toBe(12);
  });
});
