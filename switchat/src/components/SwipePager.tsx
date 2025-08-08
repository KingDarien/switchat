"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

interface SwipePagerProps {
  index: number;
  onIndexChange: (idx: number) => void;
  children: React.ReactNode[] | React.ReactNode;
}

export function SwipePager({ index, onIndexChange, children }: SwipePagerProps) {
  const pages = useMemo(
    () => (Array.isArray(children) ? children : [children]),
    [children]
  );
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef(0);
  const scrollStartRef = useRef(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const target = Math.round(index) * el.clientWidth;
    el.scrollTo({ left: target, behavior: "smooth" });
  }, [index]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const idx = Math.round(el.scrollLeft / el.clientWidth);
        if (idx !== index) onIndexChange(idx);
      });
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [index, onIndexChange]);

  // Optional drag snapping for desktop
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = containerRef.current;
    if (!el) return;
    setIsDragging(true);
    startXRef.current = e.clientX;
    scrollStartRef.current = el.scrollLeft;
    el.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const el = containerRef.current;
    if (!el) return;
    const delta = startXRef.current - e.clientX;
    el.scrollLeft = scrollStartRef.current + delta;
  };
  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = containerRef.current;
    if (!el) return;
    setIsDragging(false);
    const idx = Math.round(el.scrollLeft / el.clientWidth);
    onIndexChange(idx);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") onIndexChange(Math.max(0, index - 1));
      if (e.key === "ArrowRight")
        onIndexChange(Math.min(pages.length - 1, index + 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, pages.length, onIndexChange]);

  return (
    <div
      ref={containerRef}
      className="pager-container relative w-full overflow-x-auto overflow-y-hidden whitespace-nowrap snap-x snap-mandatory"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      {pages.map((page, i) => (
        <section
          key={i}
          className="pager-page inline-block align-top w-full h-[calc(100vh-180px)] sm:h-[calc(100vh-160px)]"
        >
          {page}
        </section>
      ))}
    </div>
  );
}