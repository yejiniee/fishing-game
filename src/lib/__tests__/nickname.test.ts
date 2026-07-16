import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  NICKNAME_MAX,
  NICKNAME_MIN,
  getNickname,
  isValidNickname,
  normalizeNickname,
  setNickname,
} from "../nickname";

class MemoryStorage {
  private store = new Map<string, string>();
  getItem(key: string): string | null {
    return this.store.has(key) ? (this.store.get(key) as string) : null;
  }
  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }
  removeItem(key: string): void {
    this.store.delete(key);
  }
  clear(): void {
    this.store.clear();
  }
}

describe("normalizeNickname", () => {
  it("앞뒤 공백을 제거한 값을 반환한다", () => {
    expect(normalizeNickname("  방어왕  ")).toBe("방어왕");
  });

  it(`${NICKNAME_MIN}자 미만은 null`, () => {
    expect(normalizeNickname("가")).toBeNull();
    expect(normalizeNickname("  ")).toBeNull();
  });

  it(`${NICKNAME_MAX}자 초과는 null`, () => {
    expect(normalizeNickname("가나다라마바사아자")).toBeNull(); // 9자
  });

  it("경계값 2자와 8자는 허용한다", () => {
    expect(normalizeNickname("가나")).toBe("가나");
    expect(normalizeNickname("가나다라마바사아")).toBe("가나다라마바사아"); // 8자
  });
});

describe("isValidNickname", () => {
  it("유효/무효를 boolean으로 반환한다", () => {
    expect(isValidNickname("방어왕")).toBe(true);
    expect(isValidNickname("가")).toBe(false);
  });
});

describe("getNickname / setNickname", () => {
  beforeEach(() => {
    (globalThis as { localStorage?: Storage }).localStorage =
      new MemoryStorage() as unknown as Storage;
  });
  afterEach(() => {
    delete (globalThis as { localStorage?: Storage }).localStorage;
  });

  it("저장 전에는 null", () => {
    expect(getNickname()).toBeNull();
  });

  it("저장한 값을 그대로 읽는다", () => {
    setNickname("방어왕");
    expect(getNickname()).toBe("방어왕");
  });
});
