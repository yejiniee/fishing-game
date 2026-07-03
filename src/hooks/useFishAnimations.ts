import { useEffect, useRef, type RefObject } from "react";
import { gsap } from "gsap";

export interface FishRefs {
  body: RefObject<SVGGElement | null>;
  tail: RefObject<SVGGElement | null>;
}

// 몸통 g는 타원 중심, 꼬리 g는 몸통과 맞닿는 관절을 축으로 회전/스케일한다.
const BODY_ORIGIN = "70 45";
const TAIL_ORIGIN = "118 45";

export function useFishAnimations(refs: FishRefs) {
  const activeTweens = useRef<(gsap.core.Tween | gsap.core.Timeline)[]>([]);

  useEffect(() => {
    if (refs.body.current) gsap.set(refs.body.current, { svgOrigin: BODY_ORIGIN });
    if (refs.tail.current) gsap.set(refs.tail.current, { svgOrigin: TAIL_ORIGIN });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function killAll() {
    for (const tween of activeTweens.current) tween.kill();
    activeTweens.current = [];
  }

  // 착지 후 팔딱거리는 대기 모션. flapSpeed가 클수록(점수가 오를수록) 더 다급하게 움직인다.
  function playIdle(flapSpeed = 1) {
    killAll();
    const { body, tail } = refs;
    if (!body.current) return;
    gsap.set(body.current, { x: 0, y: 0, rotation: 0, scale: 1, opacity: 1 });

    const flap = 0.16 / flapSpeed;
    const bodyTl = gsap.timeline({ repeat: -1 });
    bodyTl
      .to(body.current, { scaleY: 0.9, scaleX: 1.06, rotation: -5, duration: flap, ease: "sine.inOut" })
      .to(body.current, { scaleY: 1.06, scaleX: 0.96, rotation: 5, duration: flap, ease: "sine.inOut" })
      .to(body.current, { scaleY: 1, scaleX: 1, rotation: 0, duration: flap * 1.2, ease: "sine.inOut" })
      .to({}, { duration: flap * 2 });

    activeTweens.current.push(bodyTl);
    if (tail.current) {
      const tailTween = gsap.to(tail.current, {
        rotation: 20,
        duration: flap,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
      });
      activeTweens.current.push(tailTween);
    }
  }

  // 다른 위치로 튀어 오르는 점프 모션 (도약 → 체공 → 착지).
  function playJump(durationMs: number, onComplete?: () => void) {
    killAll();
    const { body, tail } = refs;
    if (!body.current) {
      onComplete?.();
      return;
    }
    const d = durationMs / 1000;
    const tl = gsap.timeline({ onComplete });
    tl.to(body.current, { scaleX: 1.2, scaleY: 0.8, rotation: 0, duration: d * 0.15, ease: "power1.out" })
      .to(body.current, { y: -24, rotation: -16, scaleX: 0.92, scaleY: 1.08, duration: d * 0.4, ease: "power2.out" })
      .to(body.current, { y: 0, rotation: 8, duration: d * 0.35, ease: "power2.in" })
      .to(body.current, { scaleX: 1.15, scaleY: 0.85, rotation: 0, duration: d * 0.06 })
      .to(body.current, { scaleX: 1, scaleY: 1, duration: 0.14, ease: "elastic.out(1,0.5)" });
    activeTweens.current.push(tl);

    if (tail.current) {
      const tailTween = gsap.to(tail.current, {
        rotation: 26,
        duration: d * 0.12,
        yoyo: true,
        repeat: 6,
        ease: "sine.inOut",
      });
      activeTweens.current.push(tailTween);
    }
  }

  // 손(그물)에 잡혀 순간적으로 움츠러들며 사라지는 모션.
  function playCatch(durationMs: number) {
    killAll();
    const { body } = refs;
    if (!body.current) return;
    const d = durationMs / 1000;
    const tl = gsap.timeline();
    tl.to(body.current, { scaleX: 1.35, scaleY: 0.65, rotation: 10, duration: d * 0.3, ease: "power2.out" }).to(
      body.current,
      { scale: 0.35, rotation: 25, opacity: 0, duration: d * 0.55, ease: "power1.in" },
    );
    activeTweens.current.push(tl);
  }

  return { playIdle, playJump, playCatch, killAll };
}
