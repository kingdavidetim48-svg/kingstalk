"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import {
  AudioLines,
  Volume2,
  Sparkles,
  ArrowRight,
  Check,
  Waves,
  Mic,
  Zap,
  Shield,
  Globe,
} from "lucide-react";

/* ─── Scroll reveal hook ─────────────────────────────────────── */
function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll("[data-reveal]");
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            (e.target as HTMLElement).style.setProperty("--revealed", "1");
            e.target.classList.add("revealed");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.1 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

/* ─── Particle field ──────────────────────────────────────────── */
function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let W = (canvas.width = window.innerWidth);
    let H = (canvas.height = window.innerHeight * 2);
    const resize = () => {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight * 2;
    };
    window.addEventListener("resize", resize);
    const count = 90;
    const pts = Array.from({ length: count }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 1.4 + 0.3,
      vx: (Math.random() - 0.5) * 0.18,
      vy: (Math.random() - 0.5) * 0.18,
      o: Math.random() * 0.5 + 0.15,
    }));
    let frame: number;
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      pts.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = W;
        if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H;
        if (p.y > H) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(212,175,88,${p.o})`;
        ctx.fill();
      });
      // draw connections
      for (let i = 0; i < count; i++) {
        for (let j = i + 1; j < count; j++) {
          const dx = pts[i].x - pts[j].x;
          const dy = pts[i].y - pts[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 110) {
            ctx.beginPath();
            ctx.moveTo(pts[i].x, pts[i].y);
            ctx.lineTo(pts[j].x, pts[j].y);
            ctx.strokeStyle = `rgba(212,175,88,${0.12 * (1 - dist / 110)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      frame = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
    };
  }, []);
  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 0,
        opacity: 0.7,
      }}
    />
  );
}

/* ─── Nebula background ───────────────────────────────────────── */
function Nebula() {
  return (
    <div className="nebula" aria-hidden>
      <div className="nebula__blob nb1" />
      <div className="nebula__blob nb2" />
      <div className="nebula__blob nb3" />
      <div className="nebula__blob nb4" />
      <div className="nebula__grid" />
    </div>
  );
}

/* ─── Cursor – twin ring ──────────────────────────────────────── */
function CursorRing() {
  const outer = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const pos = useRef({ x: 0, y: 0 });
  const lag = useRef({ x: 0, y: 0 });
  useEffect(() => {
    const move = (e: MouseEvent) => {
      pos.current = { x: e.clientX, y: e.clientY };
      if (inner.current) {
        inner.current.style.left = `${e.clientX}px`;
        inner.current.style.top = `${e.clientY}px`;
      }
    };
    let raf: number;
    const loop = () => {
      lag.current.x += (pos.current.x - lag.current.x) * 0.09;
      lag.current.y += (pos.current.y - lag.current.y) * 0.09;
      if (outer.current) {
        outer.current.style.left = `${lag.current.x}px`;
        outer.current.style.top = `${lag.current.y}px`;
      }
      raf = requestAnimationFrame(loop);
    };
    window.addEventListener("mousemove", move);
    raf = requestAnimationFrame(loop);
    return () => {
      window.removeEventListener("mousemove", move);
      cancelAnimationFrame(raf);
    };
  }, []);
  return (
    <>
      <div ref={outer} className="cursor-outer" aria-hidden />
      <div ref={inner} className="cursor-inner" aria-hidden />
    </>
  );
}

/* ─── Animated waveform ───────────────────────────────────────── */
function WaveBar() {
  return (
    <div className="wavebars" aria-hidden>
      {Array.from({ length: 36 }).map((_, i) => (
        <span
          key={i}
          className="wavebar"
          style={{ "--i": i } as React.CSSProperties}
        />
      ))}
    </div>
  );
}

/* ─── Floating rune glyphs ────────────────────────────────────── */
function Runes() {
  const glyphs = ["◈", "⬡", "◇", "⊕", "⌬", "◉", "⟡", "⬢"];
  return (
    <div className="runes" aria-hidden>
      {glyphs.map((g, i) => (
        <span
          key={i}
          className="rune"
          style={{ "--ri": i } as React.CSSProperties}
        >
          {g}
        </span>
      ))}
    </div>
  );
}

/* ─── Header ──────────────────────────────────────────────────── */
function Header() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);
  return (
    <header className={`kt-header${scrolled ? " kt-header--scrolled" : ""}`}>
      <div className="kt-header__inner">
        <Link href="/" className="kt-logo">
          <div className="kt-logo__img-wrap">
            <Image
              src="/kingstalkLogo.png"
              alt="KingsTalk"
              width={30}
              height={30}
              className="kt-logo__img"
            />
            <div className="kt-logo__halo" aria-hidden />
          </div>
          <span className="kt-logo__name">KingsTalk</span>
        </Link>
        <nav className="kt-nav">
          <Link href="/sign-in" className="kt-nav__link">
            Sign in
          </Link>
          <Link href="/sign-up" className="kt-btn kt-btn--sm">
            Get started <ArrowRight size={13} />
          </Link>
        </nav>
      </div>
    </header>
  );
}

/* ─── Hero ───────────────────────────────────────────────────── */
function Hero() {
  return (
    <section className="kt-hero">
      <Runes />
      <div className="kt-hero__inner">
        <div className="kt-pill" data-reveal>
          <Sparkles size={12} />
          <span>AI-powered voice synthesis</span>
        </div>

        <h1 className="kt-hero__h1" data-reveal>
          Transform your
          <br />
          <span className="kt-gradient-text">words into speech</span>
        </h1>

        <p className="kt-hero__sub" data-reveal>
          Studio-quality voiceovers, supernatural voice cloning,
          <br className="kt-br" />
          and real-time generation — powered by bleeding-edge AI.
        </p>

        <div className="kt-hero__ctas" data-reveal>
          <Link href="/sign-up" className="kt-btn kt-btn--primary kt-btn--lg">
            <span className="kt-btn__shine" aria-hidden />
            Get started free <ArrowRight size={16} />
          </Link>
          <Link href="#features" className="kt-btn kt-btn--ghost kt-btn--lg">
            <Waves size={16} /> Explore features
          </Link>
        </div>

        <WaveBar />

        <div className="kt-hero__stats" data-reveal>
          {[
            { v: "20+", l: "Lifelike voices" },
            { v: "99%", l: "Accuracy rate" },
            { v: "25ms", l: "Avg latency" },
          ].map((s) => (
            <div key={s.l} className="kt-stat">
              <span className="kt-stat__value">{s.v}</span>
              <span className="kt-stat__label">{s.l}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="kt-hero__scroll-line" aria-hidden />
    </section>
  );
}

/* ─── Features ───────────────────────────────────────────────── */
const FEATURES = [
  {
    Icon: AudioLines,
    title: "Text to Speech",
    desc: "Convert any text into natural-sounding speech. Fine-tune pitch, speed, and emphasis across dozens of lifelike voices.",
  },
  {
    Icon: Mic,
    title: "Voice Cloning",
    desc: "Upload a short audio sample and create a perfect digital replica. Your cloned voice, for any generation.",
  },
  {
    Icon: Zap,
    title: "Real-time Generation",
    desc: "Generate speech in milliseconds with our optimised inference pipeline. Audio is ready before you finish typing.",
  },
  {
    Icon: Globe,
    title: "Multi-language",
    desc: "Speak to the world with support for dozens of languages and regional accents — built for global creators.",
  },
  {
    Icon: Shield,
    title: "Enterprise Security",
    desc: "Voice data encrypted at rest and in transit. We never share or reuse your clones without explicit permission.",
  },
  {
    Icon: Volume2,
    title: "Studio Quality",
    desc: "Crystal-clear 48 kHz output that sounds natural and expressive. Perfect for podcasts, audiobooks, and video.",
  },
];

function Features() {
  return (
    <section id="features" className="kt-features">
      <div className="kt-features__arc" aria-hidden />
      <div className="kt-features__inner">
        <div className="kt-section-head" data-reveal>
          <p className="kt-eyebrow">Capabilities</p>
          <h2 className="kt-h2">
            Everything you need to
            <br />
            <span className="kt-gradient-text">create amazing audio</span>
          </h2>
          <p className="kt-section-sub">
            Powerful features designed for creators, developers, and businesses.
          </p>
        </div>
        <div className="kt-grid">
          {FEATURES.map(({ Icon, title, desc }, i) => (
            <div
              key={title}
              className="kt-card"
              data-reveal
              style={{ "--delay": `${i * 80}ms` } as React.CSSProperties}
            >
              <div className="kt-card__glow" aria-hidden />
              <div
                className="kt-card__corner kt-card__corner--tl"
                aria-hidden
              />
              <div
                className="kt-card__corner kt-card__corner--br"
                aria-hidden
              />
              <div className="kt-card__icon">
                <Icon size={19} />
              </div>
              <h3 className="kt-card__title">{title}</h3>
              <p className="kt-card__desc">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── CTA ────────────────────────────────────────────────────── */
function CTA() {
  return (
    <section className="kt-cta">
      <div className="kt-cta__ring kt-cta__ring--1" aria-hidden />
      <div className="kt-cta__ring kt-cta__ring--2" aria-hidden />
      <div className="kt-cta__ring kt-cta__ring--3" aria-hidden />
      <div className="kt-cta__inner">
        <p className="kt-eyebrow" data-reveal>
          Start now
        </p>
        <h2 className="kt-h2" data-reveal>
          Ready to bring your
          <br />
          <span className="kt-gradient-text">words to life?</span>
        </h2>
        {/* <p className="kt-section-sub" data-reveal>
          Join thousands of creators already using KingsTalk.
          <br />
          No credit card required.
        </p> */}
        <div className="kt-cta__btns" data-reveal>
          <Link href="/sign-up" className="kt-btn kt-btn--primary kt-btn--lg">
            <span className="kt-btn__shine" aria-hidden />
            Start creating free <ArrowRight size={16} />
          </Link>
          <Link href="/sign-in" className="kt-btn kt-btn--ghost kt-btn--lg">
            Sign in
          </Link>
        </div>
        {/* <div className="kt-checks" data-reveal>
          {["No credit card", "Free tier included", "Cancel anytime"].map(
            (c) => (
              <span key={c} className="kt-check">
                <Check size={13} /> {c}
              </span>
            ),
          )}
        </div> */}
      </div>
    </section>
  );
}

/* ─── Footer ─────────────────────────────────────────────────── */
function Footer() {
  return (
    <footer className="kt-footer">
      <div className="kt-footer__line" aria-hidden />
      <div className="kt-footer__inner">
        <div className="kt-logo">
          <div className="kt-logo__img-wrap">
            <Image
              src="/kingstalkLogo.png"
              alt="KingsTalk"
              width={26}
              height={26}
              className="kt-logo__img"
            />
            <div className="kt-logo__halo" aria-hidden />
          </div>
          <span className="kt-logo__name">KingsTalk</span>
        </div>
        <div className="kt-footer__links">
          <Link href="/sign-in" className="kt-nav__link">
            Sign in
          </Link>
          <Link href="/sign-up" className="kt-nav__link">
            Sign up
          </Link>
        </div>
        <p className="kt-footer__copy">
          &copy; {new Date().getFullYear()} KingsTalk. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

/* ─── Page ───────────────────────────────────────────────────── */
export default function LandingPage() {
  useReveal();
  return (
    <>
      <style>{CSS}</style>
      <CursorRing />
      <ParticleField />
      <div className="kt-root">
        <Nebula />
        <Header />
        <main>
          <Hero />
          <Features />
          <CTA />
        </main>
        <Footer />
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════
   CSS
═══════════════════════════════════════════════════════════════ */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --gold:    #d4af58;
  --gold2:   #f0d080;
  --gold3:   #fff0b0;
  --ember:   #c8853a;
  --ink:     #050408;
  --ink2:    #090710;
  --ink3:    #0e0c18;
  --surface: #14111f;
  --surface2:#1c1830;
  --border:  rgba(212,175,88,.12);
  --border2: rgba(212,175,88,.24);
  --muted:   rgba(255,255,255,.44);
  --dim:     rgba(255,255,255,.22);
  --font-display: 'Cinzel', serif;
  --font-body:    'DM Sans', system-ui, sans-serif;
}

.kt-root {
  background: var(--ink);
  color: #ede8f5;
  font-family: var(--font-body);
  overflow-x: hidden;
  -webkit-font-smoothing: antialiased;
  position: relative;
}

/* ── Custom cursor ── */
.cursor-outer, .cursor-inner {
  position: fixed;
  border-radius: 50%;
  pointer-events: none;
  z-index: 9999;
  transform: translate(-50%, -50%);
}
.cursor-outer {
  width: 38px; height: 38px;
  border: 1px solid rgba(212,175,88,.45);
  transition: width .25s, height .25s, border-color .25s;
  mix-blend-mode: screen;
}
.cursor-inner {
  width: 6px; height: 6px;
  background: var(--gold2);
  box-shadow: 0 0 10px var(--gold);
}

/* ── Nebula bg ── */
.nebula {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
}
.nebula__blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(120px);
  mix-blend-mode: screen;
}
.nb1 {
  width: 900px; height: 900px;
  background: radial-gradient(circle, rgba(160,100,220,.09) 0%, transparent 60%);
  top: -350px; left: -200px;
  animation: nbdrift 28s ease-in-out infinite;
}
.nb2 {
  width: 700px; height: 700px;
  background: radial-gradient(circle, rgba(212,175,88,.08) 0%, transparent 60%);
  top: 20%; right: -200px;
  animation: nbdrift 22s ease-in-out infinite reverse;
  animation-delay: -6s;
}
.nb3 {
  width: 600px; height: 600px;
  background: radial-gradient(circle, rgba(60,130,255,.06) 0%, transparent 60%);
  bottom: 0; left: 20%;
  animation: nbdrift 32s ease-in-out infinite;
  animation-delay: -12s;
}
.nb4 {
  width: 500px; height: 500px;
  background: radial-gradient(circle, rgba(200,133,58,.07) 0%, transparent 60%);
  top: 60%; right: 10%;
  animation: nbdrift 18s ease-in-out infinite;
  animation-delay: -3s;
}
@keyframes nbdrift {
  0%,100% { transform: translate(0,0) scale(1); }
  33%      { transform: translate(60px,-40px) scale(1.08); }
  66%      { transform: translate(-40px,30px) scale(.94); }
}

/* Grid overlay */
.nebula__grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(212,175,88,.025) 1px, transparent 1px),
    linear-gradient(90deg, rgba(212,175,88,.025) 1px, transparent 1px);
  background-size: 64px 64px;
}

/* ── Scroll reveal ── */
[data-reveal] {
  opacity: 0;
  transform: translateY(32px);
  transition:
    opacity .8s cubic-bezier(.22,1,.36,1) var(--delay, 0ms),
    transform .8s cubic-bezier(.22,1,.36,1) var(--delay, 0ms);
}
[data-reveal].revealed { opacity: 1; transform: none; }

/* ── Gradient text ── */
.kt-gradient-text {
  background: linear-gradient(110deg, var(--gold3) 0%, var(--gold2) 35%, var(--gold) 65%, var(--ember) 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  display: inline;
}

/* ── Header ── */
.kt-header {
  position: fixed;
  inset-inline: 0;
  top: 0;
  z-index: 100;
  padding: 0 2rem;
  border-bottom: 1px solid transparent;
  transition: background .4s, border-color .4s, backdrop-filter .4s;
}
.kt-header--scrolled {
  background: rgba(5,4,8,.75);
  backdrop-filter: blur(24px) saturate(160%);
  border-color: var(--border);
}
.kt-header__inner {
  max-width: 1140px;
  margin: 0 auto;
  height: 70px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

/* ── Logo ── */
.kt-logo { display: flex; align-items: center; gap: 10px; text-decoration: none; }
.kt-logo__img-wrap { position: relative; line-height: 0; }
.kt-logo__halo {
  position: absolute;
  inset: -6px;
  border-radius: 12px;
  background: rgba(212,175,88,.2);
  filter: blur(8px);
  z-index: -1;
  animation: halo-pulse 3s ease-in-out infinite;
}
@keyframes halo-pulse {
  0%,100% { opacity: .5; transform: scale(1); }
  50%      { opacity: 1;  transform: scale(1.1); }
}
.kt-logo__img { border-radius: 8px; }
.kt-logo__name {
  font-family: var(--font-display);
  font-size: .95rem;
  font-weight: 600;
  letter-spacing: .06em;
  color: #f5edd8;
}

/* ── Nav ── */
.kt-nav { display: flex; align-items: center; gap: 1.4rem; }
.kt-nav__link {
  font-size: .85rem;
  color: var(--muted);
  text-decoration: none;
  transition: color .2s;
  letter-spacing: .02em;
}
.kt-nav__link:hover { color: var(--gold2); }

/* ── Buttons ── */
.kt-btn {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  text-decoration: none;
  font-family: var(--font-body);
  font-weight: 500;
  border-radius: 100px;
  transition: all .3s cubic-bezier(.22,1,.36,1);
  cursor: pointer;
  white-space: nowrap;
  border: none;
  position: relative;
  overflow: hidden;
  letter-spacing: .01em;
}
.kt-btn__shine {
  position: absolute;
  inset: 0;
  background: linear-gradient(105deg, transparent 40%, rgba(255,255,255,.18) 50%, transparent 60%);
  transform: translateX(-100%);
  transition: transform .55s ease;
  pointer-events: none;
}
.kt-btn--primary:hover .kt-btn__shine { transform: translateX(100%); }
.kt-btn--sm {
  font-size: .78rem;
  padding: .4rem 1.1rem;
  background: linear-gradient(135deg, var(--gold2) 0%, var(--gold) 60%, var(--ember) 100%);
  color: #0e0c18;
  font-weight: 600;
  box-shadow: 0 0 18px rgba(212,175,88,.28), 0 2px 12px rgba(0,0,0,.5);
}
.kt-btn--sm:hover {
  transform: translateY(-2px) scale(1.04);
  box-shadow: 0 0 32px rgba(212,175,88,.5), 0 8px 24px rgba(0,0,0,.6);
}
.kt-btn--lg { font-size: .95rem; padding: .8rem 2rem; }
.kt-btn--primary {
  background: linear-gradient(135deg, var(--gold3) 0%, var(--gold2) 40%, var(--gold) 70%, var(--ember) 100%);
  color: #0e0c18;
  font-weight: 600;
  box-shadow:
    0 0 0 1px rgba(212,175,88,.3),
    0 0 40px rgba(212,175,88,.25),
    0 10px 40px rgba(0,0,0,.5),
    inset 0 1px 0 rgba(255,255,255,.25);
}
.kt-btn--primary:hover {
  transform: translateY(-3px) scale(1.02);
  box-shadow:
    0 0 0 1px rgba(212,175,88,.5),
    0 0 70px rgba(212,175,88,.45),
    0 20px 60px rgba(0,0,0,.6),
    inset 0 1px 0 rgba(255,255,255,.3);
}
.kt-btn--ghost {
  background: rgba(255,255,255,.03);
  color: var(--muted);
  border: 1px solid var(--border);
  backdrop-filter: blur(8px);
}
.kt-btn--ghost:hover {
  background: rgba(212,175,88,.06);
  color: var(--gold2);
  border-color: var(--border2);
  transform: translateY(-2px);
  box-shadow: 0 0 20px rgba(212,175,88,.1);
}

/* ── Pill badge ── */
.kt-pill {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: .38rem 1.1rem;
  border-radius: 100px;
  border: 1px solid rgba(212,175,88,.3);
  background: rgba(212,175,88,.06);
  font-size: .75rem;
  color: var(--gold2);
  letter-spacing: .06em;
  text-transform: uppercase;
  margin-bottom: 2rem;
  backdrop-filter: blur(12px);
  box-shadow: 0 0 20px rgba(212,175,88,.08), inset 0 1px 0 rgba(255,255,255,.06);
}

/* ── Hero ── */
.kt-hero {
  position: relative;
  min-height: 100svh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8rem 1.5rem 5rem;
  overflow: hidden;
}
.kt-hero::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 100% 70% at 50% -10%, rgba(212,175,88,.08) 0%, transparent 60%),
    radial-gradient(ellipse 60% 50% at 10% 80%, rgba(160,80,220,.05) 0%, transparent 55%);
  pointer-events: none;
}
.kt-hero__inner {
  position: relative;
  z-index: 1;
  max-width: 860px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.kt-hero__h1 {
  font-family: var(--font-display);
  font-size: clamp(2.8rem, 7.5vw, 5.6rem);
  font-weight: 700;
  line-height: 1.06;
  letter-spacing: -.01em;
  color: #f8f3e8;
  margin-bottom: 1.6rem;
  text-shadow: 0 0 80px rgba(212,175,88,.12);
}
.kt-hero__sub {
  font-size: clamp(.95rem, 2vw, 1.15rem);
  color: var(--muted);
  line-height: 1.8;
  max-width: 580px;
  margin-bottom: 2.5rem;
  font-weight: 300;
}
.kt-hero__ctas {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  justify-content: center;
  margin-bottom: 3.5rem;
}

/* ── Scroll line ── */
.kt-hero__scroll-line {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 1px;
  height: 80px;
  background: linear-gradient(to bottom, transparent, rgba(212,175,88,.5), transparent);
  animation: scroll-line 2.5s ease-in-out infinite;
}
@keyframes scroll-line {
  0%   { opacity: 0; transform: translateX(-50%) scaleY(0); transform-origin: top; }
  50%  { opacity: 1; transform: translateX(-50%) scaleY(1); }
  100% { opacity: 0; transform: translateX(-50%) scaleY(0); transform-origin: bottom; }
}

/* ── Runes ── */
.runes {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}
.rune {
  position: absolute;
  font-size: clamp(1rem, 1.5vw, 1.5rem);
  color: rgba(212,175,88,.14);
  animation: rune-float 20s ease-in-out infinite;
  animation-delay: calc(var(--ri) * -2.3s);
  user-select: none;
}
.rune:nth-child(1) { top: 12%; left: 8%; }
.rune:nth-child(2) { top: 25%; left: 92%; }
.rune:nth-child(3) { top: 60%; left: 5%; }
.rune:nth-child(4) { top: 75%; left: 88%; }
.rune:nth-child(5) { top: 40%; left: 3%; }
.rune:nth-child(6) { top: 15%; left: 78%; }
.rune:nth-child(7) { top: 85%; left: 15%; }
.rune:nth-child(8) { top: 50%; left: 95%; }
@keyframes rune-float {
  0%,100% { transform: translateY(0) rotate(0deg); opacity: .14; }
  25%      { transform: translateY(-18px) rotate(6deg); opacity: .28; }
  50%      { transform: translateY(-8px) rotate(-4deg); opacity: .1; }
  75%      { transform: translateY(-22px) rotate(8deg); opacity: .22; }
}

/* ── Waveform ── */
.wavebars {
  display: flex;
  align-items: center;
  gap: 3px;
  height: 48px;
  margin-bottom: 4rem;
}
.wavebar {
  width: 3px;
  border-radius: 4px;
  background: linear-gradient(180deg, var(--gold3), var(--gold), var(--ember));
  animation: wave 1.6s ease-in-out infinite;
  animation-delay: calc(var(--i) * 45ms);
  box-shadow: 0 0 6px rgba(212,175,88,.3);
}
@keyframes wave {
  0%,100% { height: 4px;  opacity: .25; }
  50%      { height: 36px; opacity: 1; }
}

/* ── Stats ── */
.kt-hero__stats {
  display: flex;
  gap: 4rem;
  flex-wrap: wrap;
  justify-content: center;
}
.kt-stat { text-align: center; }
.kt-stat__value {
  display: block;
  font-family: var(--font-display);
  font-size: 2.2rem;
  font-weight: 700;
  letter-spacing: -.02em;
  background: linear-gradient(135deg, var(--gold3) 0%, var(--gold2) 50%, var(--gold) 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  filter: drop-shadow(0 0 18px rgba(212,175,88,.4));
}
.kt-stat__label {
  display: block;
  font-size: .72rem;
  color: var(--dim);
  margin-top: 3px;
  letter-spacing: .1em;
  text-transform: uppercase;
}

/* ── Section shared ── */
.kt-section-head { text-align: center; margin-bottom: 4.5rem; }
.kt-eyebrow {
  font-size: .7rem;
  letter-spacing: .18em;
  text-transform: uppercase;
  color: var(--gold);
  margin-bottom: .9rem;
  font-family: var(--font-display);
}
.kt-h2 {
  font-family: var(--font-display);
  font-size: clamp(2rem, 4.5vw, 3.2rem);
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: -.01em;
  color: #f8f3e8;
  margin-bottom: 1.1rem;
  text-shadow: 0 0 60px rgba(212,175,88,.08);
}
.kt-section-sub {
  font-size: 1.05rem;
  color: var(--muted);
  line-height: 1.75;
  max-width: 520px;
  margin: 0 auto;
  font-weight: 300;
}

/* ── Features ── */
.kt-features {
  position: relative;
  padding: 8rem 1.5rem;
  overflow: hidden;
}
.kt-features__arc {
  position: absolute;
  top: 50%; left: 50%;
  transform: translate(-50%,-50%);
  width: 900px; height: 900px;
  border-radius: 50%;
  border: 1px solid rgba(212,175,88,.04);
  pointer-events: none;
}
.kt-features__arc::before {
  content: '';
  position: absolute;
  inset: -80px;
  border-radius: 50%;
  border: 1px solid rgba(212,175,88,.025);
}
.kt-features__inner {
  position: relative;
  z-index: 1;
  max-width: 1140px;
  margin: 0 auto;
}
.kt-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(310px, 1fr));
  gap: 1.5rem;
}

/* ── Feature card ── */
.kt-card {
  position: relative;
  padding: 2.2rem 2rem;
  border-radius: 20px;
  border: 1px solid var(--border);
  background: linear-gradient(148deg,
    rgba(22,18,38,.95) 0%,
    rgba(10,8,18,.98) 100%);
  overflow: hidden;
  transition: all .4s cubic-bezier(.22,1,.36,1);
  isolation: isolate;
}
.kt-card__glow {
  position: absolute;
  width: 200px; height: 200px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(212,175,88,.14) 0%, transparent 65%);
  top: -60px; left: -60px;
  pointer-events: none;
  opacity: 0;
  transition: opacity .4s, transform .4s;
  transform: scale(.8);
}
.kt-card:hover .kt-card__glow { opacity: 1; transform: scale(1); }
.kt-card__corner {
  position: absolute;
  width: 14px; height: 14px;
  pointer-events: none;
  opacity: 0;
  transition: opacity .4s;
}
.kt-card__corner--tl {
  top: 8px; left: 8px;
  border-top: 1px solid var(--gold);
  border-left: 1px solid var(--gold);
  border-radius: 2px 0 0 0;
}
.kt-card__corner--br {
  bottom: 8px; right: 8px;
  border-bottom: 1px solid var(--gold);
  border-right: 1px solid var(--gold);
  border-radius: 0 0 2px 0;
}
.kt-card:hover .kt-card__corner { opacity: 1; }
.kt-card:hover {
  transform: translateY(-6px);
  border-color: rgba(212,175,88,.3);
  box-shadow:
    0 0 0 1px rgba(212,175,88,.08),
    0 24px 80px rgba(0,0,0,.7),
    0 0 60px rgba(212,175,88,.06),
    inset 0 1px 0 rgba(212,175,88,.05);
}
.kt-card__icon {
  width: 46px; height: 46px;
  border-radius: 13px;
  background: linear-gradient(135deg, rgba(212,175,88,.16) 0%, rgba(212,175,88,.05) 100%);
  border: 1px solid rgba(212,175,88,.2);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--gold2);
  margin-bottom: 1.4rem;
  transition: all .3s;
  box-shadow: 0 0 20px rgba(212,175,88,.08);
}
.kt-card:hover .kt-card__icon {
  border-color: rgba(212,175,88,.4);
  box-shadow: 0 0 30px rgba(212,175,88,.2);
  background: linear-gradient(135deg, rgba(212,175,88,.22) 0%, rgba(212,175,88,.08) 100%);
}
.kt-card__title {
  font-family: var(--font-display);
  font-size: .9rem;
  font-weight: 600;
  color: #f5edd8;
  margin-bottom: .65rem;
  letter-spacing: .03em;
}
.kt-card__desc {
  font-size: .875rem;
  color: var(--muted);
  line-height: 1.75;
  font-weight: 300;
}

/* ── CTA ── */
.kt-cta {
  position: relative;
  padding: 10rem 1.5rem;
  text-align: center;
  overflow: hidden;
}
.kt-cta__ring {
  position: absolute;
  top: 50%; left: 50%;
  border-radius: 50%;
  border: 1px solid rgba(212,175,88,.07);
  transform: translate(-50%,-50%);
  pointer-events: none;
  animation: ring-pulse 6s ease-in-out infinite;
}
.kt-cta__ring--1 { width: 400px; height: 400px; animation-delay: 0s; }
.kt-cta__ring--2 { width: 650px; height: 650px; animation-delay: -2s; }
.kt-cta__ring--3 { width: 900px; height: 900px; animation-delay: -4s; }
@keyframes ring-pulse {
  0%,100% { opacity: .4; transform: translate(-50%,-50%) scale(1); }
  50%      { opacity: .9; transform: translate(-50%,-50%) scale(1.03); }
}
.kt-cta__inner {
  position: relative;
  z-index: 1;
  max-width: 700px;
  margin: 0 auto;
}
.kt-cta__btns {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
  margin: 2.8rem 0 2.2rem;
}
.kt-checks {
  display: flex;
  gap: 2.5rem;
  justify-content: center;
  flex-wrap: wrap;
}
.kt-check {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: .8rem;
  color: var(--dim);
  letter-spacing: .02em;
}
.kt-check svg { color: var(--gold); }

/* ── Footer ── */
.kt-footer { position: relative; padding: 2.8rem 1.5rem; }
.kt-footer__line {
  position: absolute;
  top: 0; left: 10%; right: 10%;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(212,175,88,.2), transparent);
}
.kt-footer__inner {
  max-width: 1140px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1.5rem;
}
.kt-footer__links { display: flex; gap: 2rem; }
.kt-footer__copy { font-size: .78rem; color: var(--dim); letter-spacing: .02em; }

/* ── Misc ── */
.kt-br { display: block; }
@media (max-width: 640px) {
  .kt-hero__h1 { font-size: 2.4rem; }
  .kt-hero__stats { gap: 2rem; }
  .kt-footer__inner { flex-direction: column; text-align: center; }
  .kt-footer__links { justify-content: center; }
  .kt-br { display: none; }
  .kt-checks { gap: 1.2rem; }
  .wavebars { gap: 2px; }
  .wavebar { width: 2.5px; }
  .rune { display: none; }
}

/* ── Reduced motion ── */
@media (prefers-reduced-motion: reduce) {
  [data-reveal] { opacity: 1; transform: none; transition: none; }
  .wavebar, .nebula__blob, .kt-cta__ring, .rune,
  .kt-logo__halo, .kt-hero__scroll-line { animation: none; }
  .cursor-outer, .cursor-inner { display: none; }
}
`;
