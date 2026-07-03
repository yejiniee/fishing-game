import { useEffect, useId, useRef, type RefObject } from "react";
import type { CreatureKind, FishExpression, FishPhase, FishSize } from "../types/fish";
import { useFishAnimations, type FishRefs } from "../hooks/useFishAnimations";
import { CATCH_DELAY_MS, FISH_SIZES } from "../lib/fishGame";

interface FishProps {
  phase: FishPhase;
  round: number;
  kind: CreatureKind;
  size: FishSize;
  expression: FishExpression;
  flapSpeed: number;
  jumpDurationMs: number;
  onCatch: () => void;
}

const BASE_WIDTH = 132;
const BASE_HEIGHT = 70;

// 방어는 헷갈리지 않도록 항상 같은 색으로 고정한다 (크기·표정만 무작위).
const YELLOWTAIL_COLORS = {
  gradientFrom: "#7dd3fc",
  gradientMid: "#38bdf8",
  gradientTo: "#0284c7",
  stroke: "#0369a1",
  stripe: "#facc15",
  fin: "#0ea5e9",
};

const PUFFER_COLORS = {
  gradientFrom: "#fde9c2",
  gradientMid: "#f3c072",
  gradientTo: "#c2872f",
  stroke: "#7c4a12",
  spike: "#a35a12",
  belly: "#fff7ed",
};

const SQUID_COLORS = {
  gradientFrom: "#f0abfc",
  gradientMid: "#d946ef",
  gradientTo: "#a21caf",
  stroke: "#701a75",
};

function YellowtailFace({ expression }: { expression: FishExpression }) {
  const stroke = YELLOWTAIL_COLORS.stroke;
  switch (expression) {
    case "happy":
      return (
        <>
          <path d="M28,38 Q33,31 39,37" stroke="#0f172a" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path d="M14,45 Q22,56 31,45" stroke={stroke} strokeWidth="2.5" fill="none" strokeLinecap="round" />
        </>
      );
    case "surprised":
      return (
        <>
          <circle cx="33" cy="35" r="9" fill="white" stroke={stroke} strokeWidth="1.5" />
          <circle cx="33" cy="35" r="3" fill="#0f172a" />
          <circle cx="16" cy="47" r="4.5" fill="none" stroke={stroke} strokeWidth="2" />
        </>
      );
    case "sleepy":
      return (
        <>
          <path d="M25,36 Q33,40 41,36" stroke="#0f172a" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path d="M17,46 L27,46" stroke={stroke} strokeWidth="2" fill="none" strokeLinecap="round" />
        </>
      );
    case "normal":
    default:
      return (
        <>
          <circle cx="33" cy="36" r="7.5" fill="white" stroke={stroke} strokeWidth="1.5" />
          <circle cx="31.5" cy="36" r="4" fill="#0f172a" />
          <circle cx="30" cy="34.5" r="1.2" fill="white" />
          <path d="M15,45 Q22,48 29,45" stroke={stroke} strokeWidth="2" fill="none" strokeLinecap="round" />
        </>
      );
  }
}

function YellowtailShape({ gradientId, expression, tailRef }: { gradientId: string; expression: FishExpression; tailRef: RefObject<SVGGElement | null> }) {
  const c = YELLOWTAIL_COLORS;
  return (
    <>
      <defs>
        <linearGradient id={gradientId} x1="70" y1="22" x2="70" y2="68" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={c.gradientFrom} />
          <stop offset="0.55" stopColor={c.gradientMid} />
          <stop offset="1" stopColor={c.gradientTo} />
        </linearGradient>
      </defs>
      <g ref={tailRef}>
        <path d="M118,45 L158,18 L140,45 L158,72 Z" fill={c.gradientMid} stroke={c.stroke} strokeWidth="2" strokeLinejoin="round" />
      </g>
      <path d="M50,23 Q68,4 88,20 Q70,16 55,26 Z" fill={c.fin} />
      <path d="M42,53 Q36,70 52,66 Q49,57 47,51 Z" fill={c.fin} opacity="0.9" />
      <ellipse cx="70" cy="45" rx="48" ry="23" fill={`url(#${gradientId})`} stroke={c.stroke} strokeWidth="2" />
      <path d="M25,50 Q70,68 115,50 Q70,60 25,50 Z" fill="#f8fafc" opacity="0.9" />
      <path d="M22,43 Q70,35 118,43 L118,48 Q70,41 22,48 Z" fill={c.stripe} />
      <YellowtailFace expression={expression} />
    </>
  );
}

// 복어 — 잡으면 안 되는 미끼. 둥글고 가시가 돋아 방어와 실루엣이 확실히 다르다.
function PufferShape({ gradientId, tailRef }: { gradientId: string; tailRef: RefObject<SVGGElement | null> }) {
  const c = PUFFER_COLORS;
  const cx = 92;
  const cy = 45;
  const r = 30;
  const spikeCount = 12;
  const spikeLen = 9;
  const spikeHalfWidth = 2.6;
  const spikes = Array.from({ length: spikeCount }, (_, i) => {
    const angle = (i / spikeCount) * Math.PI * 2;
    const bx = cx + r * Math.cos(angle);
    const by = cy + r * Math.sin(angle);
    const tx = cx + (r + spikeLen) * Math.cos(angle);
    const ty = cy + (r + spikeLen) * Math.sin(angle);
    const perp = angle + Math.PI / 2;
    const b1x = bx + spikeHalfWidth * Math.cos(perp);
    const b1y = by + spikeHalfWidth * Math.sin(perp);
    const b2x = bx - spikeHalfWidth * Math.cos(perp);
    const b2y = by - spikeHalfWidth * Math.sin(perp);
    return `M${b1x.toFixed(1)},${b1y.toFixed(1)} L${tx.toFixed(1)},${ty.toFixed(1)} L${b2x.toFixed(1)},${b2y.toFixed(1)} Z`;
  });

  return (
    <>
      <defs>
        <radialGradient id={gradientId} cx="0.4" cy="0.35" r="0.75">
          <stop offset="0" stopColor={c.gradientFrom} />
          <stop offset="0.6" stopColor={c.gradientMid} />
          <stop offset="1" stopColor={c.gradientTo} />
        </radialGradient>
      </defs>
      <g ref={tailRef}>
        <path d="M120,45 L136,34 L131,45 L136,56 Z" fill={c.gradientMid} stroke={c.stroke} strokeWidth="1.5" strokeLinejoin="round" />
      </g>
      {spikes.map((d, i) => (
        <path key={i} d={d} fill={c.spike} stroke={c.stroke} strokeWidth="0.5" />
      ))}
      <circle cx={cx} cy={cy} r={r} fill={`url(#${gradientId})`} stroke={c.stroke} strokeWidth="2" />
      <path d="M68,58 Q92,74 112,56 Q92,64 68,58 Z" fill={c.belly} opacity="0.85" />
      {/* 화난 듯 놀란 표정 — 항상 고정 (방어와 헷갈리지 않도록) */}
      <path d="M58,24 L74,28" stroke={c.stroke} strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="70" cy="37" r="8.5" fill="white" stroke={c.stroke} strokeWidth="1.5" />
      <circle cx="68" cy="37" r="4.5" fill="#0f172a" />
      <circle cx="58" cy="52" r="4" fill="#7c2d12" />
    </>
  );
}

// 오징어 — 잡으면 안 되는 미끼. 몸통 + 다리(촉수) 실루엣이 물고기와 확연히 다르다.
// 촉수는 머리 한 점(headX)에서 부채꼴로 퍼지고, 지느러미는 몸통을 그린 "다음"에 그려서
// 몸통에 가려지지 않고 꼬리 끝에 또렷이 붙어 보이게 한다.
function SquidShape({ gradientId, tailRef }: { gradientId: string; tailRef: RefObject<SVGGElement | null> }) {
  const c = SQUID_COLORS;
  const headX = 78;
  const headY = 46;
  return (
    <>
      <defs>
        <linearGradient id={gradientId} x1="72" y1="26" x2="146" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={c.gradientFrom} />
          <stop offset="0.55" stopColor={c.gradientMid} />
          <stop offset="1" stopColor={c.gradientTo} />
        </linearGradient>
      </defs>
      {/* 촉수 (다리) — 머리 한 점에서 부채꼴로 퍼진다 */}
      <path d={`M${headX},${headY - 5} Q50,24 24,21`} stroke={c.gradientTo} strokeWidth="3.2" fill="none" strokeLinecap="round" />
      <path d={`M${headX},${headY - 2} Q52,32 21,32`} stroke={c.gradientTo} strokeWidth="3.2" fill="none" strokeLinecap="round" />
      <path d={`M${headX},${headY + 1} Q54,45 19,45`} stroke={c.gradientTo} strokeWidth="3.2" fill="none" strokeLinecap="round" />
      <path d={`M${headX},${headY + 4} Q52,56 20,58`} stroke={c.gradientTo} strokeWidth="3.2" fill="none" strokeLinecap="round" />
      <path d={`M${headX},${headY + 7} Q50,64 23,70`} stroke={c.gradientTo} strokeWidth="3.2" fill="none" strokeLinecap="round" />
      {/* 몸통(외투막) — 매끈한 타원으로 통일해 삐뚤어 보이지 않게 한다 */}
      <ellipse cx="108" cy="45" rx="37" ry="19" fill={`url(#${gradientId})`} stroke={c.stroke} strokeWidth="2" />
      {/* 꼬리 지느러미 — 몸통 위에 그려서 확실히 붙어 보인다. flutter 애니메이션 대상 */}
      <g ref={tailRef}>
        <path d="M136,29 Q157,16 149,37 Z" fill={c.gradientMid} stroke={c.stroke} strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M136,61 Q157,74 149,53 Z" fill={c.gradientMid} stroke={c.stroke} strokeWidth="1.5" strokeLinejoin="round" />
      </g>
      {/* 능청스러운 표정 — 항상 고정 */}
      <circle cx="88" cy="39" r="9" fill="white" stroke={c.stroke} strokeWidth="1.5" />
      <ellipse cx="86" cy="40" rx="4" ry="5" fill="#0f172a" />
      <path d="M80,53 Q88,58 97,53" stroke={c.stroke} strokeWidth="2.2" fill="none" strokeLinecap="round" />
    </>
  );
}

function Fish({ phase, round, kind, size, expression, flapSpeed, jumpDurationMs, onCatch }: FishProps) {
  const bodyRef = useRef<SVGGElement>(null);
  const tailRef = useRef<SVGGElement>(null);
  const refs: FishRefs = { body: bodyRef, tail: tailRef };
  const { playIdle, playJump, playCatch, killAll } = useFishAnimations(refs);
  const gradientId = useId();

  useEffect(() => {
    if (phase === "grounded") playIdle(flapSpeed);
    else if (phase === "jumping") playJump(jumpDurationMs);
    else if (phase === "caught") playCatch(CATCH_DELAY_MS);
    return () => killAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, round]);

  const clickable = phase === "grounded";
  const scale = FISH_SIZES[size].scale;
  const label = kind === "yellowtail" ? "방어 잡기" : kind === "pufferfish" ? "복어 (잡지 마세요!)" : "오징어 (잡지 마세요!)";

  return (
    <svg
      viewBox="0 0 170 90"
      width={Math.round(BASE_WIDTH * scale)}
      height={Math.round(BASE_HEIGHT * scale)}
      className={clickable ? "cursor-pointer drop-shadow-md" : "pointer-events-none drop-shadow-md"}
      onClick={clickable ? onCatch : undefined}
      role={clickable ? "button" : undefined}
      aria-label={clickable ? label : undefined}
    >
      <g ref={bodyRef}>
        {kind === "yellowtail" && <YellowtailShape gradientId={gradientId} expression={expression} tailRef={tailRef} />}
        {kind === "pufferfish" && <PufferShape gradientId={gradientId} tailRef={tailRef} />}
        {kind === "squid" && <SquidShape gradientId={gradientId} tailRef={tailRef} />}
      </g>
    </svg>
  );
}

export default Fish;
