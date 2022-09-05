import { reactive } from "../reactive";
import { effect, stop} from "../effect";
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

  it("should return runner call effect", () => {
    let foo = 10;
    const runner = effect(() => {
      foo++;
      return "foo";
    });
    expect(foo).toBe(11);
    const res = runner();
    expect(foo).toBe(12);
    expect(res).toBe("foo");
  });

  it("scheduler", () => {
    let dummy;
    let run;
    // 创建一个函数
    const scheduler = jest.fn(() => {
      run = runner;
    });
    const _object = reactive({
      foo: 10,
    });
    const runner = effect(
      () => {
        dummy = _object.foo;
      },
      { scheduler }
    );
    // 断言 scheduler 从未被调用过
    expect(scheduler).not.toHaveBeenCalled();
    // effect 初始化时，fn 被调用，dummy = 10
    expect(dummy).toBe(10);

    // // 更新 响应对象的值
    _object.foo++;
    // // 断言 scheduler 被调用 1 次
    expect(scheduler).toHaveBeenCalledTimes(1);
    // 断言 是 10 因为 此时不会执行 fn，而是执行 scheduler
    expect(dummy).toBe(10);
    // // 调用 run ，因为响应式对象值更新后，effect会执行 scheduler，在scheduler中将 effect的返回值赋值给 run，调用 run 相当于调用 fn
    run();
    // // 通过前面 run调用，执行了 fn，将最新的值赋值给 dummy
    expect(dummy).toBe(11);
  });

  it('stop', () => {
    let dummy;
    const _object = reactive({
      foo: 10
    });
    const runner = effect(() =>{
      dummy = _object.foo;
    })
    // update 更新响应对象
    _object.foo = 11;
    expect(dummy).toBe(11);
    // 调用 stop 传入 effect 返回的 runner 方法，此时effect 的 fn 不会被执行
    // 因为调用当前 stop 后，effect 实例里的 stop 方法会将 deps 收集到的依赖全部清空掉
    // 所以当后续 update 响应对象的时候 trigger 不会 触发 run
    stop(runner);
    _object.foo = 12;
    // 断言 effect 的 fn 不会被执行 所以值不会变
    expect(dummy).not.toBe(12);

    // 调用 runner 触发 effect 的 fn
    runner();
    expect(dummy).toBe(12);

    stop(runner);
    _object.foo = 13;
    expect(dummy).not.toBe(13)
    
    runner();
    expect(dummy).toBe(13);
  })
});
