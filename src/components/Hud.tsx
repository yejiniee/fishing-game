interface HudProps {
  score: number;
  best: number;
  lives: number;
  maxLives: number;
  combo: number;
}

function Hud({ score, best, lives, maxLives, combo }: HudProps) {
  return (
    <div className="relative flex items-center gap-3 rounded-2xl bg-white/70 px-4 py-3 shadow-md backdrop-blur">
      <div className="flex flex-1 flex-col">
        <span className="text-[11px] font-semibold text-slate-500">SCORE</span>
        <span className="text-2xl font-extrabold leading-none text-sky-700">{score}</span>
      </div>
      <div className="flex items-center gap-0.5" aria-label={`목숨 ${lives}개 남음`}>
        {Array.from({ length: maxLives }, (_, i) => (
          <span key={i} className={`text-base ${i < lives ? "opacity-100" : "opacity-25 grayscale"}`}>
            🐟
          </span>
        ))}
      </div>
      <div className="flex flex-col items-end">
        <span className="text-[11px] font-semibold text-slate-500">BEST</span>
        <span className="text-sm font-bold text-slate-700">{best}</span>
      </div>
      {combo >= 3 && (
        <span className="absolute right-4 top-14 rounded-full bg-orange-400 px-2.5 py-1 text-xs font-extrabold text-white shadow">
          🔥 {combo} 콤보
        </span>
      )}
    </div>
  );
}

export default Hud;
