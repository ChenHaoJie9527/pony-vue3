import { mutableHandles, readonlyHandles } from "./baseHandlers";

export enum REACTIVE_FLAGS {
  IS_REACTIVE = "__reactive_flag",
}
export function reactive(raw) {
  return createActiveOption(raw, mutableHandles);
}

export function readonly(raw) {
  return createActiveOption(raw, readonlyHandles);
}

function createActiveOption(raw: any, baseHandlers: any) {
  return new Proxy(raw, baseHandlers);
}

/**
 *
 * @param target: 需要判断的对象
 * 当调用 isReactive 时，会触发 getter 操作，即 proxy 的 get
 */
export function isReactive(target) {
  return !!target[REACTIVE_FLAGS.IS_REACTIVE];
}
