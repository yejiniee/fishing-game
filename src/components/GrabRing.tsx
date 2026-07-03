const RADIUS = 34;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const BASE_SIZE = 96;

interface GrabRingProps {
  dwellMs: number;
  resetKey: number;
  scale: number;
}

function GrabRing({ dwellMs, resetKey, scale }: GrabRingProps) {
  const size = Math.round(BASE_SIZE * scale);
  return (
    <svg width={size} height={size} viewBox="0 0 96 96" className="pointer-events-none">
      <circle cx="48" cy="48" r={RADIUS} fill="none" stroke="#ffffff" strokeOpacity="0.35" strokeWidth="5" />
      <circle
        key={resetKey}
        cx="48"
        cy="48"
        r={RADIUS}
        fill="none"
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray={CIRCUMFERENCE}
        className="grab-ring"
        style={{ animationDuration: `${dwellMs}ms`, transform: "rotate(-90deg)", transformOrigin: "48px 48px" }}
      />
    </svg>
  );
}

export default GrabRing;
