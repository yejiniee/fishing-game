import { describe, expect, it } from "vitest";
import { buildFileName, buildShareText } from "../shareImage";

describe("buildShareText", () => {
  it("마릿수와 칭호를 담은 공유 문구를 만든다", () => {
    const text = buildShareText(12, "오마카세 사장님");
    expect(text).toContain("12마리");
    expect(text).toContain("오마카세 사장님");
  });
});

describe("buildFileName", () => {
  it("마릿수를 담은 png 파일명을 만든다", () => {
    expect(buildFileName(42)).toBe("bangeo-jabgi-42마리.png");
  });
});
