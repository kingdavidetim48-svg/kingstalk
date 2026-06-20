"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { Home, MicOff, ArrowLeft } from "lucide-react";

/* ─── Cursor glow ────────────────────────────────────────────── */
function CursorGlow() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const move = (e: MouseEvent) => {
      if (!ref.current) return;
      ref.current.style.left = `${e.clientX}px`;
      ref.current.style.top = `${e.clientY}px`;
    };
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, []);
  return <div ref={ref} className="nf-glow" aria-hidden />;
}

/* ─── Floating orbs ──────────────────────────────────────────── */
function Orbs() {
  return (
    <div className="nf-orbs" aria-hidden>
      <span className="nf-orb nf-orb-1" />
      <span className="nf-orb nf-orb-2" />
      <span className="nf-orb nf-orb-3" />
      <span className="nf-orb nf-orb-4" />
    </div>
  );
}

/* ─── Animated voice bars ────────────────────────────────────── */
function VoiceBars() {
  return (
    <div className="nf-bars" aria-hidden>
      {Array.from({ length: 7 }).map((_, i) => (
        <span
          key={i}
          className="nf-bar"
          style={{ "--i": i } as React.CSSProperties}
        />
      ))}
    </div>
  );
}

/* ─── Wavy 404 digits ────────────────────────────────────────── */
function Digits() {
  return (
    <div className="nf-digits">
      {["4", "0", "4"].map((d, i) => (
        <span
          key={i}
          className="nf-digit"
          style={
            {
              animationDelay: `${i * 0.15}s`,
              "--dx": `${(i - 1) * 6}px`,
            } as React.CSSProperties
          }
        >
          {d}
        </span>
      ))}
    </div>
  );
}

/* ─── Glitch overlay ─────────────────────────────────────────── */
function Glitch() {
  return (
    <div className="nf-glitch" aria-hidden>
      <div className="nf-glitch__strip" />
      <div className="nf-glitch__strip" />
      <div className="nf-glitch__strip" />
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────────── */
export default function NotFound() {
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>("[data-nf-reveal]");
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            (e.target as HTMLElement).classList.add("nf-revealed");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.1 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <>
      <style>{CSS}</style>
      <CursorGlow />
      <Orbs />
      <Glitch />
      <div className="nf-root">
        <main className="nf-main">
          <Digits />
          <VoiceBars />
          <div className="nf-badge" data-nf-reveal>
            <MicOff size={13} />
            <span>Page not found</span>
          </div>
          <h1 className="nf-h1" data-nf-reveal>
            This page went
            <br />
            <span className="nf-gradient">off&nbsp;script</span>
          </h1>
          <p className="nf-sub" data-nf-reveal>
            The URL you&apos;re looking for doesn&apos;t exist or has been
            moved. Let&apos;s get you back on track.
          </p>
          <div className="nf-ctas" data-nf-reveal>
            <Link href="/" className="nf-btn nf-btn--primary nf-btn--lg">
              <Home size={16} />
              Back to home
            </Link>
            <Link href="/sign-up" className="nf-btn nf-btn--ghost nf-btn--lg">
              <ArrowLeft size={15} />
              Get started
            </Link>
          </div>
        </main>
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════
   CSS
════════════════════════════════════════════════════════════════ */
const CSS = `
/* ── Reset ── */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

/* ── Variables ── */
.nf-root {
  --gold:   #c9a84c;
  --gold2:  #e8cc80;
  --ink:    #07060a;
  --ink2:   #0d0c12;
  --ink3:   #13111a;
  --surface:#1a1825;
  --border: rgba(201,168,76,.13);
  --muted:  rgba(255,255,255,.42);
  --dim:    rgba(255,255,255,.22);

  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--ink);
  color: #e8e6f0;
  font-family: 'Inter', system-ui, sans-serif;
  overflow: hidden;
  -webkit-font-smoothing: antialiased;
}

/* ── Cursor glow ── */
.nf-glow {
  pointer-events: none;
  position: fixed;
  width: 520px;
  height: 520px;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  background: radial-gradient(circle, rgba(201,168,76,.06) 0%, transparent 70%);
  z-index: 0;
  transition: left .08s linear, top .08s linear;
}

/* ── Orbs ── */
.nf-orbs { position: fixed; inset: 0; overflow: hidden; pointer-events: none; z-index: 0; }
.nf-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(100px);
  opacity: .4;
  animation: nf-drift 20s ease-in-out infinite;
}
.nf-orb-1 {
  width: 700px; height: 700px;
  background: radial-gradient(circle, rgba(201,168,76,.12) 0%, transparent 65%);
  top: -250px; left: -250px;
  animation-duration: 24s;
}
.nf-orb-2 {
  width: 500px; height: 500px;
  background: radial-gradient(circle, rgba(120,80,200,.1) 0%, transparent 60%);
  bottom: -150px; right: -150px;
  animation-duration: 28s;
  animation-delay: -6s;
}
.nf-orb-3 {
  width: 400px; height: 400px;
  background: radial-gradient(circle, rgba(201,168,76,.08) 0%, transparent 65%);
  top: 40%; left: -100px;
  animation-duration: 22s;
  animation-delay: -12s;
}
.nf-orb-4 {
  width: 350px; height: 350px;
  background: radial-gradient(circle, rgba(180,120,255,.06) 0%, transparent 65%);
  top: 20%; right: -80px;
  animation-duration: 18s;
  animation-delay: -3s;
}
@keyframes nf-drift {
  0%, 100% { transform: translate(0, 0) scale(1); }
  25%      { transform: translate(30px, -40px) scale(1.05); }
  50%      { transform: translate(-40px, 20px) scale(.95); }
  75%      { transform: translate(20px, 30px) scale(1.02); }
}

/* ── Glitch overlay ── */
.nf-glitch {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 1;
  overflow: hidden;
  opacity: .03;
}
.nf-glitch__strip {
  position: absolute;
  width: 100%;
  height: 2px;
  background: var(--gold);
  animation: nf-glitch 3s ease-in-out infinite;
}
.nf-glitch__strip:nth-child(1) { top: 15%; animation-delay: 0s; }
.nf-glitch__strip:nth-child(2) { top: 55%; animation-delay: .4s; }
.nf-glitch__strip:nth-child(3) { top: 80%; animation-delay: .8s; }
@keyframes nf-glitch {
  0%, 90%, 100% { transform: translateX(-100%); opacity: 0; }
  92%           { transform: translateX(0); opacity: 1; }
  94%           { transform: translateX(2px); opacity: .8; }
  96%           { transform: translateX(-1px); opacity: 1; }
  98%           { transform: translateX(100%); opacity: 0; }
}

/* ── Main ── */
.nf-main {
  position: relative;
  z-index: 2;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem;
  max-width: 600px;
}

/* ── 404 digits ── */
.nf-digits {
  display: flex;
  gap: clamp(.5rem, 2vw, 1.5rem);
  margin-bottom: 1rem;
  perspective: 800px;
}
.nf-digit {
  font-size: clamp(6rem, 22vw, 14rem);
  font-weight: 800;
  line-height: 1;
  letter-spacing: -.06em;
  background: linear-gradient(160deg, var(--gold2) 0%, var(--gold) 40%, #a07830 70%, var(--gold) 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: none;
  filter: drop-shadow(0 0 60px rgba(201,168,76,.25)) drop-shadow(0 20px 40px rgba(0,0,0,.5));
  animation: nf-float 3s ease-in-out infinite;
  animation-delay: calc(var(--i, 0) * 0.15s);
  transform: translateX(var(--dx, 0));
}
.nf-digit:nth-child(1) { --i: 0; }
.nf-digit:nth-child(2) { --i: 1; }
.nf-digit:nth-child(3) { --i: 2; }
@keyframes nf-float {
  0%, 100% { transform: translateX(var(--dx, 0)) translateY(0) rotate(0deg); }
  25%      { transform: translateX(var(--dx, 0)) translateY(-10px) rotate(-1deg); }
  50%      { transform: translateX(var(--dx, 0)) translateY(0) rotate(0deg); }
  75%      { transform: translateX(var(--dx, 0)) translateY(-6px) rotate(1deg); }
}

/* ── Voice bars ── */
.nf-bars {
  display: flex;
  align-items: center;
  gap: 4px;
  height: 32px;
  margin-bottom: 2.5rem;
  opacity: .5;
}
.nf-bar {
  width: 4px;
  border-radius: 4px;
  background: linear-gradient(180deg, var(--gold2), var(--gold));
  animation: nf-wave 1.6s ease-in-out infinite;
  animation-delay: calc(var(--i) * 80ms);
}
.nf-bar:nth-child(1) { height: 8px; }
.nf-bar:nth-child(2) { height: 18px; }
.nf-bar:nth-child(3) { height: 28px; }
.nf-bar:nth-child(4) { height: 32px; }
.nf-bar:nth-child(5) { height: 22px; }
.nf-bar:nth-child(6) { height: 14px; }
.nf-bar:nth-child(7) { height: 6px; }
@keyframes nf-wave {
  0%, 100% { opacity: .3;  transform: scaleY(1); }
  50%      { opacity: 1;   transform: scaleY(1.3); }
}

/* ── Badge ── */
.nf-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: .35rem 1rem;
  border-radius: 100px;
  border: 1px solid rgba(201,168,76,.28);
  background: rgba(201,168,76,.06);
  font-size: .75rem;
  letter-spacing: .05em;
  text-transform: uppercase;
  color: var(--gold);
  margin-bottom: 1.25rem;
}

/* ── Text ── */
.nf-h1 {
  font-size: clamp(2rem, 5vw, 3rem);
  font-weight: 700;
  line-height: 1.12;
  letter-spacing: -.025em;
  color: #f4f0e8;
  margin-bottom: 1rem;
}
.nf-gradient {
  background: linear-gradient(115deg, var(--gold2) 0%, var(--gold) 50%, #a07830 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}
.nf-sub {
  font-size: clamp(.9rem, 1.6vw, 1.05rem);
  color: var(--muted);
  line-height: 1.75;
  max-width: 460px;
  margin-bottom: 2.5rem;
}

/* ── Buttons ── */
.nf-ctas {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  justify-content: center;
}
.nf-btn {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  text-decoration: none;
  font-weight: 500;
  border-radius: 100px;
  transition: all .25s cubic-bezier(.22,1,.36,1);
  cursor: pointer;
  white-space: nowrap;
  border: none;
}
.nf-btn--lg { font-size: .95rem; padding: .78rem 1.9rem; }
.nf-btn--primary {
  background: linear-gradient(135deg, var(--gold2) 0%, var(--gold) 55%, #a07830 100%);
  color: #0d0c12;
  font-weight: 600;
  box-shadow: 0 0 30px rgba(201,168,76,.3), 0 8px 32px rgba(0,0,0,.4);
}
.nf-btn--primary:hover {
  transform: translateY(-2px) scale(1.03);
  box-shadow: 0 0 50px rgba(201,168,76,.45), 0 16px 48px rgba(0,0,0,.5);
}
.nf-btn--ghost {
  background: rgba(255,255,255,.04);
  color: var(--muted);
  border: 1px solid var(--border);
}
.nf-btn--ghost:hover {
  background: rgba(255,255,255,.08);
  color: #f0ecda;
  border-color: rgba(201,168,76,.3);
  transform: translateY(-1px);
}

/* ── Reveal ── */
[data-nf-reveal] {
  opacity: 0;
  transform: translateY(20px);
  transition:
    opacity .6s cubic-bezier(.22,1,.36,1) 200ms,
    transform .6s cubic-bezier(.22,1,.36,1) 200ms;
}
[data-nf-reveal].nf-revealed {
  opacity: 1;
  transform: translateY(0);
}

/* ── Reduced motion ── */
@media (prefers-reduced-motion: reduce) {
  .nf-orb, .nf-bar, .nf-digit, .nf-glitch__strip { animation: none !important; }
  .nf-glow, .nf-glitch { display: none; }
  [data-nf-reveal] { opacity: 1; transform: none; transition: none; }
}

/* ── Mobile ── */
@media (max-width: 480px) {
  .nf-ctas { flex-direction: column; align-items: center; width: 100%; }
  .nf-btn--lg { width: 100%; justify-content: center; }
}
`;
