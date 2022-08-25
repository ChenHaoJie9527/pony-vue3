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
    nextAge.foo++;
    expect(nextAge).toBe(12);
  });
});
