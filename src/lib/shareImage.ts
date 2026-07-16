// 결과 카드 이미지 생성 + 공유/다운로드 (PRD §3.9, §5.5)
import { toBlob } from "html-to-image";

// 공유 문구 (순수 함수 — 테스트 대상)
export function buildShareText(catchCount: number, title: string): string {
  return `🐟 방어잡기에서 방어 ${catchCount}마리 잡고 "${title}" 달성! 나도 도전해보기`;
}

// 다운로드 파일명 (순수 함수 — 테스트 대상)
export function buildFileName(catchCount: number): string {
  return `bangeo-jabgi-${catchCount}마리.png`;
}

// 결과 카드 DOM을 PNG Blob으로 변환한다.
export async function createCardBlob(node: HTMLElement): Promise<Blob> {
  const blob = await toBlob(node, { pixelRatio: 2, cacheBust: true });
  if (!blob) throw new Error("이미지를 만들지 못했습니다");
  return blob;
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

// Web Share API로 이미지 파일을 공유한다. 지원하지 않으면 다운로드로 대체한다.
export async function shareOrDownloadImage(
  blob: Blob,
  filename: string,
  text: string,
): Promise<void> {
  const file = new File([blob], filename, { type: "image/png" });

  if (navigator.canShare?.({ files: [file] }) && navigator.share) {
    try {
      await navigator.share({ files: [file], text });
      return;
    } catch (err) {
      // 사용자가 공유 시트를 닫으면 AbortError — 조용히 종료
      if (err instanceof DOMException && err.name === "AbortError") return;
      // 그 외 실패는 다운로드로 폴백
    }
  }

  downloadBlob(blob, filename);
}
