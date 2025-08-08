"use client";
import React from "react";

export function BrandHeader() {
  return (
    <header className="px-4 pt-5 pb-3">
      <div className="max-w-5xl mx-auto flex items-center gap-3">
        <div className="h-9 w-9 rounded-xl brand-gradient" />
        <div>
          <h1 className="text-xl font-extrabold tracking-tight">
            <span className="text-[color:var(--primary)]">SWIT</span>
            <span className="text-[color:var(--accent)]">CHAT</span>
          </h1>
          <p className="text-xs text-white/60">Voice • Video • Posts</p>
        </div>
      </div>
    </header>
  );
}