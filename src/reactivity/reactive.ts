import { mutableHandles, readonlyHandles } from "./baseHandlers";
export function reactive(raw) {
  return createActiveOption(raw, mutableHandles);
}

export function readonly(raw) {
  return createActiveOption(raw, readonlyHandles);
}

function createActiveOption(raw: any, baseHandlers: any) {
  return new Proxy(raw, baseHandlers);
}

