import { useEffect, useRef, type RefObject } from "react";
import { gsap } from "gsap";
import type { Feedback } from "../types/fish";

interface SplashLayerProps {
  trigger: Feedback | null;
  containerRef: RefObject<HTMLDivElement | null>;
}

const PARTICLE_COUNT = 10;

function SplashLayer({ trigger, containerRef }: SplashLayerProps) {
  const layerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!trigger || !layerRef.current || !containerRef.current) return;
    const { width, height } = containerRef.current.getBoundingClientRect();
    const originX = (trigger.position.x / 100) * width;
    const originY = (trigger.position.y / 100) * height;
    const emoji = trigger.kind === "catch" ? "💦" : trigger.kind === "penalty" ? "💥" : "💨";
    const layer = layerRef.current;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const el = document.createElement("div");
      el.textContent = emoji;
      el.style.position = "absolute";
      el.style.left = `${originX}px`;
      el.style.top = `${originY}px`;
      el.style.fontSize = `${12 + Math.random() * 10}px`;
      layer.appendChild(el);

      const angle = (Math.PI * 2 * i) / PARTICLE_COUNT + Math.random() * 0.5;
      const dist = 30 + Math.random() * 40;
      const dx = Math.cos(angle) * dist;
      const dy = Math.sin(angle) * dist - 10;

      gsap
        .timeline({ onComplete: () => el.remove() })
        .fromTo(
          el,
          { x: 0, y: 0, opacity: 1, scale: 0.6 },
          { x: dx, y: dy, scale: 1, duration: 0.5, ease: "power2.out" },
          0,
        )
        .to(el, { opacity: 0, duration: 0.35 }, 0.35);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger?.id]);

  return <div ref={layerRef} className="pointer-events-none absolute inset-0 overflow-hidden" />;
}

export default SplashLayer;
