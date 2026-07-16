import { useState } from "react";
import {
  NICKNAME_MAX,
  NICKNAME_MIN,
  isValidNickname,
  normalizeNickname,
} from "../lib/nickname";

interface NicknameInputProps {
  initialValue?: string;
  onSubmit: (nickname: string) => void;
  onCancel?: () => void; // 변경 모드에서 취소할 때
  submitLabel?: string;
}

// 랭킹 등록용 닉네임 입력 카드. 게임오버 시 최초 1회 입력, 또는 기존 닉네임 변경에 쓴다. (PRD §3.8)
function NicknameInput({
  initialValue = "",
  onSubmit,
  onCancel,
  submitLabel = "랭킹 등록",
}: NicknameInputProps) {
  const [value, setValue] = useState(initialValue);
  const valid = isValidNickname(value);
  const showError = value.length > 0 && !valid;

  function handleSubmit() {
    const normalized = normalizeNickname(value);
    if (normalized) onSubmit(normalized);
  }

  return (
    <div className="flex w-full max-w-xs flex-col gap-2 rounded-2xl bg-white/95 p-4 text-slate-800 shadow-lg">
      <label htmlFor="nickname" className="text-sm font-bold">
        닉네임을 정해주세요
      </label>
      <input
        id="nickname"
        type="text"
        value={value}
        maxLength={NICKNAME_MAX}
        autoComplete="off"
        placeholder={`${NICKNAME_MIN}~${NICKNAME_MAX}자`}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && valid) handleSubmit();
        }}
        className="rounded-xl border-2 border-slate-200 px-3 py-2 text-base outline-none focus:border-amber-400"
      />
      <div className="flex items-center justify-between text-xs">
        <span className={showError ? "text-rose-500" : "text-slate-400"}>
          {showError
            ? `${NICKNAME_MIN}~${NICKNAME_MAX}자로 입력해주세요`
            : " "}
        </span>
        <span className="text-slate-400">
          {value.trim().length}/{NICKNAME_MAX}
        </span>
      </div>
      <div className="flex gap-2">
        {onCancel && (
          <button
            onClick={onCancel}
            className="flex-1 rounded-full bg-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 transition active:scale-95"
          >
            취소
          </button>
        )}
        <button
          onClick={handleSubmit}
          disabled={!valid}
          className="flex-1 rounded-full bg-amber-400 px-4 py-2.5 text-sm font-extrabold text-slate-900 shadow transition active:scale-95 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
        >
          {submitLabel}
        </button>
      </div>
    </div>
  );
}

export default NicknameInput;
