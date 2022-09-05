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
