import { track } from "../effect";
describe("track", () => {
  it("happy path", () => {
    const user = {
        age: 10
    };
    track(user, 'age');
  });
});
