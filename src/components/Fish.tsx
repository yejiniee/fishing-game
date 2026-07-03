import { useEffect, useId, useRef, type RefObject } from "react";
import type { CreatureKind, FishExpression, FishPhase, FishSize } from "../types/fish";
import { useFishAnimations, type AnimationOrigins, type FishRefs } from "../hooks/useFishAnimations";
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

// 참고 이미지(둥근 몸통 + 귀 모양 지느러미 + 두꺼운 검정 외곽선 + 스캘럽 촉수)를 따른
// 플랫 스티커 아이콘 스타일 팔레트. 그라디언트 없이 단색으로 칠한다.
const SQUID_COLORS = {
  mantle: "#ff6f6f",
  mantleHighlight: "#ffa3a3",
  ear: "#e04b4b",
  tentacleDark: "#ff7a7a",
  tentacleLight: "#ffb3b3",
  outline: "#20212b",
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

// 다른 종들은 그물 링이 "몸통 중심"에 맞춰진다 (방어는 몸통 타원 중심, 복어는 원 중심 —
// 지느러미·꼬리처럼 뻗어나온 부위는 링 밖으로 나가도 무방). 오징어도 같은 규칙을 따르도록
// 몸통(외투막) 중심을 뷰박스 정중앙(85,45)에 맞추고, 촉수는 몸통 아래로 늘어져 링 밖으로
// 자연스럽게 삐져나오게 한다. 이전 버전은 몸통이 위쪽으로 치우쳐 있어 링 중심과 어긋나 보였다.
const SQUID_CENTER_X = 85;
const SQUID_CENTER_Y = 45;
const SQUID_MANTLE_RX = 27;
const SQUID_MANTLE_RY = 24;
const SQUID_TENTACLE_COUNT = 7;
const SQUID_TENTACLE_BASE_Y = SQUID_CENTER_Y + SQUID_MANTLE_RY - 3; // 몸통 아랫단과 살짝 겹쳐 이음매 없이 연결
const SQUID_BODY_ORIGIN = `${SQUID_CENTER_X} ${SQUID_CENTER_Y}`;
const SQUID_TAIL_ORIGIN = `${SQUID_CENTER_X} ${SQUID_TENTACLE_BASE_Y}`;

// 오징어 — 잡으면 안 되는 미끼. 참고 이미지 느낌(동그란 몸통 + 귀 지느러미 + 두꺼운
// 외곽선 + 아래로 늘어진 스캘럽 촉수)의 플랫 스티커 아이콘 스타일로 그린다.
// 손으로 좌표를 일일이 맞춘 베지어 곡선 대신 원/타원 위주로 구성해 비율이 삐뚤어지지 않게 했다.
function SquidShape({ tailRef }: { tailRef: RefObject<SVGGElement | null> }) {
  const c = SQUID_COLORS;
  const earY = SQUID_CENTER_Y - SQUID_MANTLE_RY + 11;

  const tentacles = Array.from({ length: SQUID_TENTACLE_COUNT }, (_, i) => {
    const t = i / (SQUID_TENTACLE_COUNT - 1);
    const cx = 58 + t * 54; // 58 ~ 112
    const isLong = i % 2 === 0;
    const tipY = SQUID_TENTACLE_BASE_Y + (isLong ? 20 : 12);
    const halfW = 6.5;
    const midY = (SQUID_TENTACLE_BASE_Y + tipY) / 2;
    const d = `M${(cx - halfW).toFixed(1)},${SQUID_TENTACLE_BASE_Y} Q${(cx - halfW - 1.5).toFixed(1)},${midY.toFixed(1)} ${cx.toFixed(1)},${tipY} Q${(cx + halfW + 1.5).toFixed(1)},${midY.toFixed(1)} ${(cx + halfW).toFixed(1)},${SQUID_TENTACLE_BASE_Y} Z`;
    return { d, fill: isLong ? c.tentacleDark : c.tentacleLight };
  });

  return (
    <>
      {/* 촉수 — 몸통 아래로 늘어져 스캘럽(물결) 테두리를 만든다. flutter 애니메이션 대상.
          기준점(SQUID_TAIL_ORIGIN)이 촉수가 몸통에 붙는 지점이라 회전해도 자연스럽게 살랑거린다. */}
      <g ref={tailRef}>
        {tentacles.map((tentacle, i) => (
          <path key={i} d={tentacle.d} fill={tentacle.fill} stroke={c.outline} strokeWidth="2.2" strokeLinejoin="round" />
        ))}
      </g>
      {/* 귀 모양 지느러미 — 몸통에 가려 끝만 보이도록 몸통보다 먼저 그린다 */}
      <ellipse cx="60" cy={earY} rx="11" ry="7" fill={c.ear} stroke={c.outline} strokeWidth="2.5" transform={`rotate(-35 60 ${earY})`} />
      <ellipse cx="110" cy={earY} rx="11" ry="7" fill={c.ear} stroke={c.outline} strokeWidth="2.5" transform={`rotate(35 110 ${earY})`} />
      {/* 몸통(외투막) — 매끈한 타원 두 겹(본체 + 하이라이트)으로만 구성해 비율이 항상 둥글게 유지된다.
          중심이 뷰박스 정중앙(SQUID_CENTER_Y)이라 그물 링과 자연스럽게 맞아떨어진다. */}
      <ellipse cx={SQUID_CENTER_X} cy={SQUID_CENTER_Y} rx={SQUID_MANTLE_RX} ry={SQUID_MANTLE_RY} fill={c.mantle} stroke={c.outline} strokeWidth="3" />
      <ellipse cx={SQUID_CENTER_X} cy={SQUID_CENTER_Y - 2} rx="15" ry="17" fill={c.mantleHighlight} />
      {/* 능청스러운 표정 — 항상 고정 (점 두 개) */}
      <circle cx="76" cy={SQUID_CENTER_Y + 7} r="3.8" fill={c.outline} />
      <circle cx="94" cy={SQUID_CENTER_Y + 7} r="3.8" fill={c.outline} />
    </>
  );
}

// 종마다 몸통 중심/부속지 관절 위치가 다르므로 애니메이션 회전축도 종별로 따로 지정한다.
const ANIMATION_ORIGINS: Record<CreatureKind, AnimationOrigins> = {
  yellowtail: { body: "70 45", tail: "118 45" },
  pufferfish: { body: "92 45", tail: "120 45" },
  squid: { body: SQUID_BODY_ORIGIN, tail: SQUID_TAIL_ORIGIN },
};

function Fish({ phase, round, kind, size, expression, flapSpeed, jumpDurationMs, onCatch }: FishProps) {
  const bodyRef = useRef<SVGGElement>(null);
  const tailRef = useRef<SVGGElement>(null);
  const refs: FishRefs = { body: bodyRef, tail: tailRef };
  const { playIdle, playJump, playCatch, killAll } = useFishAnimations(refs, ANIMATION_ORIGINS[kind]);
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
      // overflow-visible: 점프/팔딱임 애니메이션이 body g를 회전·이동시킬 때 그림이
      // 자기 viewBox 밖으로 나가는데, svg 기본값(hidden)이면 그 부분이 잘려 보인다.
      className={
        clickable
          ? "cursor-pointer overflow-visible drop-shadow-md"
          : "pointer-events-none overflow-visible drop-shadow-md"
      }
      onClick={clickable ? onCatch : undefined}
      role={clickable ? "button" : undefined}
      aria-label={clickable ? label : undefined}
    >
      <g ref={bodyRef}>
        {kind === "yellowtail" && <YellowtailShape gradientId={gradientId} expression={expression} tailRef={tailRef} />}
        {kind === "pufferfish" && <PufferShape gradientId={gradientId} tailRef={tailRef} />}
        {kind === "squid" && <SquidShape tailRef={tailRef} />}
      </g>
    </svg>
  );
}

export default Fish;
