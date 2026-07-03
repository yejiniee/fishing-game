import { useRef, type RefObject } from "react";
import { gsap } from "gsap";

export interface FishRefs {
  body: RefObject<SVGGElement | null>;
  tail: RefObject<SVGGElement | null>;
}

// 몸통 g는 몸통 중심, 꼬리(또는 촉수 등 부속지) g는 몸통과 맞닿는 관절을 축으로
// 회전/스케일해야 자연스럽다. 종마다 실루엣이 다르므로 호출하는 쪽(Fish.tsx)에서
// 각 종의 실제 좌표에 맞는 pivot을 넘겨준다 — 하드코딩하면 다른 모양에 재사용할 때
// 엉뚱한 지점을 축으로 돌아 촉수/지느러미가 크게 휘청거리는 문제가 생긴다.
export interface AnimationOrigins {
  body: string; // "cx cy" — svgOrigin 형식
  tail: string;
}

export function useFishAnimations(refs: FishRefs, origins: AnimationOrigins) {
  const activeTweens = useRef<(gsap.core.Tween | gsap.core.Timeline)[]>([]);

  function killAll() {
    for (const tween of activeTweens.current) tween.kill();
    activeTweens.current = [];
  }

  // 매 애니메이션 시작마다 transform을 완전히 지운 "깨끗한 상태"에서 svgOrigin을 다시
  // 지정한다. 리롤로 종(kind)이 바뀌면 회전축도 바뀌는데, 이전 애니메이션의 회전이 남은
  // 채로 svgOrigin만 바꾸면 GSAP smoothOrigin이 화면 위치를 보존하려고 보정 이동값을
  // 끼워 넣고, 그 오프셋이 회전을 0으로 되돌린 뒤에도 영구히 남아 생물이 그물 링
  // 중심에서 어긋난다.
  function resetTransforms() {
    const { body, tail } = refs;
    if (body.current) {
      gsap.set(body.current, { clearProps: "transform" });
      gsap.set(body.current, { svgOrigin: origins.body });
    }
    if (tail.current) {
      gsap.set(tail.current, { clearProps: "transform" });
      gsap.set(tail.current, { svgOrigin: origins.tail });
    }
  }

  // 착지 후 팔딱거리는 대기 모션. flapSpeed가 클수록(점수가 오를수록) 더 다급하게 움직인다.
  function playIdle(flapSpeed = 1) {
    killAll();
    resetTransforms();
    const { body, tail } = refs;
    if (!body.current) return;
    gsap.set(body.current, { opacity: 1 });

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
    resetTransforms();
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
    resetTransforms();
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
