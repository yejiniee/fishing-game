import { nextTitleGap, titleForCatches } from "../lib/titles";

interface GameOverOverlayProps {
  score: number;
  catchCount: number;
  best: number;
  onRestart: () => void;
}

function GameOverOverlay({ score, catchCount, best, onRestart }: GameOverOverlayProps) {
  const isNewBest = score > 0 && score >= best;
  const title = titleForCatches(catchCount);
  const gap = nextTitleGap(catchCount);

  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-2 rounded-3xl bg-slate-900/60 px-6 text-center backdrop-blur-sm">
      <span className="text-5xl">🎣</span>
      <h2 className="text-2xl font-extrabold text-white drop-shadow">놓쳤다! 게임 종료</h2>
      <p className="text-sm font-medium text-white/80">
        잡은 방어 {catchCount}마리 · 점수 {score}점
      </p>
      <div className="mt-1 rounded-full bg-amber-400/40 px-4 py-1.5 text-sm font-extrabold text-white shadow">
        🏅 {title}
      </div>
      {gap && <p className="text-xs text-white/70">다음 칭호 「{gap.title}」까지 {gap.remaining}마리</p>}
      {isNewBest ? (
        <p className="text-sm font-semibold text-emerald-300">🎉 최고 점수 갱신!</p>
      ) : (
        <p className="text-sm font-medium text-white/80">최고 점수: {best}점</p>
      )}
      <button
        onClick={onRestart}
        className="mt-2 rounded-full bg-amber-400 px-8 py-3 text-lg font-extrabold text-slate-900 shadow-lg transition active:scale-95"
      >
        다시하기
      </button>
    </div>
  );
}

export default GameOverOverlay;
