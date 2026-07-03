import type { Feedback } from "../types/fish";

interface FeedbackToastProps {
  feedback: Feedback | null;
}

const STYLE: Record<Feedback["kind"], string> = {
  catch: "bg-emerald-500",
  escape: "bg-amber-500",
  penalty: "bg-rose-600",
};

function FeedbackToast({ feedback }: FeedbackToastProps) {
  if (!feedback) return null;
  const prefix = feedback.kind === "catch" ? `+${feedback.points ?? 1} ` : feedback.kind === "penalty" ? "⚠️ " : "";
  return (
    <div
      key={feedback.id}
      className={`toast-pop pointer-events-none absolute left-1/2 top-3 z-20 whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-bold text-white shadow-lg ${STYLE[feedback.kind]}`}
    >
      {prefix}
      {feedback.message}
    </div>
  );
}

export default FeedbackToast;
