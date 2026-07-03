import Hud from "./components/Hud";
import GameStage from "./components/GameStage";
import StartOverlay from "./components/StartOverlay";
import GameOverOverlay from "./components/GameOverOverlay";
import { useFishGame } from "./hooks/useFishGame";
import { Analytics } from "@vercel/analytics/react";

function App() {
  const {
    phase,
    fish,
    score,
    catchCount,
    best,
    lives,
    maxLives,
    combo,
    feedback,
    start,
    catchFish,
  } = useFishGame();

  return (
    <div className="fixed inset-0 flex justify-center bg-slate-800">
      {/* 모바일 고정 프레임 — 프레임 밖은 단색 여백 */}
      <div className="relative flex h-dvh w-full max-w-[430px] flex-col gap-3 bg-slate-800 p-3">
        <header>
          <Hud
            score={score}
            best={best}
            lives={lives}
            maxLives={maxLives}
            combo={combo}
          />
        </header>
        <main className="relative flex-1">
          <GameStage
            fish={fish}
            catchCount={catchCount}
            feedback={phase === "playing" ? feedback : null}
            onCatch={catchFish}
          />
          {phase === "ready" && <StartOverlay onStart={start} />}
          {phase === "gameover" && (
            <GameOverOverlay
              score={score}
              catchCount={catchCount}
              best={best}
              onRestart={start}
            />
          )}
        </main>
      </div>
      <Analytics />
    </div>
  );
}

export default App;
