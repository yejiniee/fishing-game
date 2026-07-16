// 랭킹 닉네임 저장·검증 (PRD §3.8)
// localStorage에 보관해 재방문 시 같은 이름으로 자동 등록되게 한다. 변경도 가능.

const NICKNAME_KEY = "bangeo-jabgi:nickname";

export const NICKNAME_MIN = 2;
export const NICKNAME_MAX = 8;

// 저장된 닉네임. 없으면 null.
export function getNickname(): string | null {
  try {
    return localStorage.getItem(NICKNAME_KEY);
  } catch {
    return null;
  }
}

export function setNickname(value: string): void {
  try {
    localStorage.setItem(NICKNAME_KEY, value);
  } catch {
    // localStorage 접근 불가 환경은 저장을 건너뛴다.
  }
}

// 앞뒤 공백을 제거한 뒤 2~8자면 그 값을, 아니면 null을 반환한다.
export function normalizeNickname(raw: string): string | null {
  const trimmed = raw.trim();
  if (trimmed.length < NICKNAME_MIN || trimmed.length > NICKNAME_MAX) return null;
  return trimmed;
}

export function isValidNickname(raw: string): boolean {
  return normalizeNickname(raw) !== null;
}
