// 기기별 고유 식별자(device_id). 랭킹 등록·조회에서 "내 기록"을 판별하는 데 쓴다.
// localStorage에 보관해 새로고침·재방문에도 유지된다. (PRD §5.4)

const DEVICE_ID_KEY = "bangeo-jabgi:device-id";

// localStorage 접근 불가(사생활 보호 모드 등) 환경을 위한 세션 내 폴백 캐시
let memoryId: string | null = null;

function generateId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  // crypto.randomUUID 미지원 환경용 폴백 (RFC4122 v4 형식)
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// 저장된 기기 ID를 반환한다. 없으면 새로 만들어 localStorage에 저장한다.
// localStorage를 못 쓰면 세션 동안만 유지되는 폴백 ID를 반환한다.
export function getDeviceId(): string {
  try {
    const stored = localStorage.getItem(DEVICE_ID_KEY);
    if (stored) return stored;
  } catch {
    // 읽기 실패 → 아래 폴백 경로로
  }

  if (!memoryId) memoryId = generateId();

  try {
    localStorage.setItem(DEVICE_ID_KEY, memoryId);
  } catch {
    // 저장 실패는 무시 (세션 내에서는 memoryId로 일관 유지)
  }

  return memoryId;
}
