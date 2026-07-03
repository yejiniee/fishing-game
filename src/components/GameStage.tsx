import { useRef } from "react";
import type { Feedback, FishEntity } from "../types/fish";
import { FISH_SIZES, dwellMsFor, jumpMsFor } from "../lib/fishGame";
import Fish from "./Fish";
import GrabRing from "./GrabRing";
import FeedbackToast from "./FeedbackToast";
import SplashLayer from "./SplashLayer";

interface GameStageProps {
  fish: FishEntity[];
  catchCount: number;
  feedback: Feedback | null;
  onCatch: (fishId: number) => void;
}

function GameStage({ fish, catchCount, feedback, onCatch }: GameStageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const jumpDurationMs = jumpMsFor(catchCount);
  const baselineDwellMs = dwellMsFor(0, "medium");

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-hidden rounded-3xl bg-gradient-to-b from-sky-300 via-cyan-500 to-amber-100 shadow-inner"
    >
      {/* 물결 장식 */}
      <div className="absolute inset-x-0 top-1/3 h-px bg-white/20" />
      <div className="absolute inset-x-0 top-2/3 h-px bg-white/15" />
      <div className="absolute bottom-0 h-1/5 w-full bg-gradient-to-t from-amber-200/80 to-transparent" />

      <FeedbackToast feedback={feedback} />
      <SplashLayer trigger={feedback} containerRef={containerRef} />

      {fish.map((entity) => {
        const sizeInfo = FISH_SIZES[entity.size];
        const dwellMs = dwellMsFor(catchCount, entity.size);
        const flapSpeed = baselineDwellMs / dwellMs;
        return (
          <div
            key={entity.id}
            className="absolute flex -translate-x-1/2 -translate-y-1/2 items-center justify-center"
            style={{
              left: `${entity.position.x}%`,
              top: `${entity.position.y}%`,
              transition:
                entity.phase === "jumping" ? `left ${jumpDurationMs}ms ease-out, top ${jumpDurationMs}ms ease-out` : "none",
            }}
          >
            {entity.phase === "grounded" && (
              <div className="absolute">
                <GrabRing dwellMs={dwellMs} resetKey={entity.round} scale={sizeInfo.scale} />
              </div>
            )}
            <Fish
              phase={entity.phase}
              round={entity.round}
              kind={entity.kind}
              size={entity.size}
              expression={entity.expression}
              flapSpeed={flapSpeed}
              jumpDurationMs={jumpDurationMs}
              onCatch={() => onCatch(entity.id)}
            />
          </div>
        );
      })}
    </div>
  );
}

export default GameStage;
