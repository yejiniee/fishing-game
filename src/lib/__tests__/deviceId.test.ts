import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getDeviceId } from "../deviceId";

// node 환경에는 localStorage가 없어 Map 기반 목으로 대체한다.
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

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

describe("getDeviceId", () => {
  beforeEach(() => {
    (globalThis as { localStorage?: Storage }).localStorage =
      new MemoryStorage() as unknown as Storage;
  });

  afterEach(() => {
    delete (globalThis as { localStorage?: Storage }).localStorage;
  });

  it("returns a UUID v4 형식의 문자열", () => {
    expect(getDeviceId()).toMatch(UUID_RE);
  });

  it("여러 번 호출해도 같은 ID를 반환한다(영속성)", () => {
    const first = getDeviceId();
    const second = getDeviceId();
    expect(second).toBe(first);
  });

  it("생성한 ID를 localStorage에 저장한다", () => {
    const id = getDeviceId();
    expect(localStorage.getItem("bangeo-jabgi:device-id")).toBe(id);
  });

  it("이미 저장된 ID가 있으면 그대로 사용한다", () => {
    localStorage.setItem("bangeo-jabgi:device-id", "existing-id-value");
    expect(getDeviceId()).toBe("existing-id-value");
  });
});
