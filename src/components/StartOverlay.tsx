import { pickRandom } from "../lib/random";
import { READY_TIPS } from "../constants/messages";

interface StartOverlayProps {
  onStart: () => void;
}

function StartOverlay({ onStart }: StartOverlayProps) {
  const tip = pickRandom(READY_TIPS);
  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 rounded-3xl bg-slate-900/55 px-6 text-center backdrop-blur-sm">
      <span className="text-6xl">🐟</span>
      <h1 className="text-3xl font-extrabold text-white drop-shadow">방어잡기</h1>
      <p className="max-w-[260px] text-sm font-medium leading-relaxed text-white/90">{tip}</p>
      <p className="max-w-[260px] rounded-xl bg-rose-500/25 px-3 py-2 text-xs font-semibold leading-relaxed text-rose-100">
        🐡 복어 · 🦑 오징어는 잡으면 목숨이 줄어요! 건드리지 말고 피하세요.
      </p>
      <button
        onClick={onStart}
        className="mt-1 rounded-full bg-amber-400 px-8 py-3 text-lg font-extrabold text-slate-900 shadow-lg transition active:scale-95"
      >
        시작하기
      </button>
    </div>
  );
}

export default StartOverlay;
