"use client";

// Tooltip compartido: un único <div class="tt"> en el DOM que seguimos con el ratón.
let ttEl: HTMLElement | null = null;

function el(): HTMLElement | null {
  if (typeof document === "undefined") return null;
  if (!ttEl) ttEl = document.querySelector(".tt");
  return ttEl;
}

export function showTT(e: { clientX: number; clientY: number }, html: string): void {
  const t = el();
  if (!t) return;
  t.innerHTML = html;
  t.style.opacity = "1";
  t.style.left = Math.min(e.clientX + 12, window.innerWidth - t.offsetWidth - 8) + "px";
  t.style.top = e.clientY - t.offsetHeight - 10 + "px";
}

export function hideTT(): void {
  const t = el();
  if (t) t.style.opacity = "0";
}
