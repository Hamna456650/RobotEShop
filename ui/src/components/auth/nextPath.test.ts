import { describe, expect, it } from "vitest";
import { afterSignIn, safeNext } from "./nextPath";

describe("safeNext", () => {
  it("refuses anything that is not a same-site path", () => {
    expect(safeNext("https://elsewhere.example")).toBe("/");
    expect(safeNext("//elsewhere.example")).toBe("/");
    expect(safeNext("/community")).toBe("/community");
  });
});

describe("afterSignIn", () => {
  it("lands on the dashboard when no page was named", () => {
    expect(afterSignIn(null)).toBe("/dashboard");
  });
  it("never sends a signed-in person back to the landing page", () => {
    expect(afterSignIn("/")).toBe("/dashboard");
  });
  it("returns to the page the person was reading", () => {
    expect(afterSignIn("/community")).toBe("/community");
    expect(afterSignIn("/catalog/sensors?skill=Beginner")).toBe(
      "/catalog/sensors?skill=Beginner",
    );
  });
  it("still refuses an open redirect", () => {
    expect(afterSignIn("//elsewhere.example")).toBe("/dashboard");
  });
});
