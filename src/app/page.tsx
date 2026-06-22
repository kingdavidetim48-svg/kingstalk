"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import {
  AudioLines,
  Volume2,
  Sparkles,
  ArrowRight,
  Waves,
  Mic,
  Zap,
  Shield,
  Globe,
  ChevronDown,
  Play,
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
      { threshold: 0.08 },
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
    const count = 80;
    const pts = Array.from({ length: count }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 1.4 + 0.2,
      vx: (Math.random() - 0.5) * 0.12,
      vy: (Math.random() - 0.5) * 0.12,
      o: Math.random() * 0.35 + 0.08,
      pulse: Math.random() * Math.PI * 2,
    }));
    let frame: number;
    const draw = (t: number) => {
      ctx.clearRect(0, 0, W, H);
      pts.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.pulse += 0.012;
        if (p.x < 0) p.x = W;
        if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H;
        if (p.y > H) p.y = 0;
        const alpha = p.o * (0.7 + 0.3 * Math.sin(p.pulse));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(212,175,88,${alpha})`;
        ctx.fill();
      });
      for (let i = 0; i < count; i++) {
        for (let j = i + 1; j < count; j++) {
          const dx = pts[i].x - pts[j].x;
          const dy = pts[i].y - pts[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 110) {
            ctx.beginPath();
            ctx.moveTo(pts[i].x, pts[i].y);
            ctx.lineTo(pts[j].x, pts[j].y);
            ctx.strokeStyle = `rgba(212,175,88,${0.08 * (1 - dist / 110)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
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
        opacity: 0.55,
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
      <div className="nebula__blob nb5" />
      <div className="nebula__blob nb6" />
      <div className="nebula__grid" />
      <div className="nebula__vignette" />
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
      lag.current.x += (pos.current.x - lag.current.x) * 0.085;
      lag.current.y += (pos.current.y - lag.current.y) * 0.085;
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
      {Array.from({ length: 48 }).map((_, i) => (
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
  const glyphs = ["◈", "⬡", "◇", "⊕", "⌬", "◉", "⟡", "⬢", "△", "◎", "❋", "⌖"];
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
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);
  return (
    <header className={`kt-header${scrolled ? " kt-header--scrolled" : ""}`}>
      <div className="kt-header__inner">
        <Link href="/" className="kt-logo" onClick={() => setMenuOpen(false)}>
          <div className="kt-logo__img-wrap">
            <Image
              src="/kingstalkLogo.png"
              alt="KingsTalk"
              width={32}
              height={32}
              className="kt-logo__img"
            />
            <div className="kt-logo__halo" aria-hidden />
          </div>
          <span className="kt-logo__name">KingsTalk</span>
        </Link>

        <nav className="kt-nav kt-nav--desktop">
          <Link href="#features" className="kt-nav__link">
            Features
          </Link>
          <Link href="#how" className="kt-nav__link">
            How it works
          </Link>
          <Link href="/sign-in" className="kt-nav__link">
            Sign in
          </Link>
          <Link href="/sign-up" className="kt-btn kt-btn--sm">
            Get started <ArrowRight size={12} />
          </Link>
        </nav>

        <button
          className={`kt-hamburger${menuOpen ? " is-open" : ""}`}
          aria-label="Toggle menu"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <span />
          <span />
          <span />
        </button>
      </div>

      <div className={`kt-mobile-menu${menuOpen ? " is-open" : ""}`}>
        <nav className="kt-mobile-nav">
          <Link
            href="#features"
            className="kt-mobile-nav__link"
            onClick={() => setMenuOpen(false)}
          >
            Features
          </Link>
          <Link
            href="#how"
            className="kt-mobile-nav__link"
            onClick={() => setMenuOpen(false)}
          >
            How it works
          </Link>
          <Link
            href="/sign-in"
            className="kt-mobile-nav__link"
            onClick={() => setMenuOpen(false)}
          >
            Sign in
          </Link>
          <Link
            href="/sign-up"
            className="kt-btn kt-btn--primary kt-mobile-cta"
            onClick={() => setMenuOpen(false)}
          >
            Get started <ArrowRight size={14} />
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
      <div className="kt-hero__arc kt-hero__arc--1" aria-hidden />
      <div className="kt-hero__arc kt-hero__arc--2" aria-hidden />
      <div className="kt-hero__arc kt-hero__arc--3" aria-hidden />
      <div className="kt-hero__glow-center" aria-hidden />

      <div className="kt-hero__inner">
        <div className="kt-pill" data-reveal>
          <Sparkles size={11} />
          <span>AI-powered voice synthesis</span>
        </div>

        <h1 className="kt-hero__h1" data-reveal>
          Your words,
          <br />
          <span className="kt-gradient-text">beautifully spoken</span>
        </h1>

        <p className="kt-hero__sub" data-reveal>
          Studio-quality text-to-speech powered by cutting-edge AI.
          <br className="kt-br" />
          Choose from 20+ expressive voices across dozens of languages.
        </p>

        <div className="kt-hero__ctas" data-reveal>
          <Link href="/sign-up" className="kt-btn kt-btn--primary kt-btn--lg">
            <span className="kt-btn__shine" aria-hidden />
            Start for free <ArrowRight size={16} />
          </Link>
          <Link href="#features" className="kt-btn kt-btn--ghost kt-btn--lg">
            <Waves size={15} /> See features
          </Link>
        </div>

        <div className="kt-hero__wave-wrap" data-reveal>
          <div className="kt-hero__wave-label">
            <span className="kt-hero__wave-dot" aria-hidden />
            Live synthesis preview
          </div>
          <WaveBar />
        </div>

        <div className="kt-hero__stats" data-reveal>
          {[
            { v: "20+", l: "Lifelike voices" },
            { v: "99%", l: "Accuracy rate" },
            { v: "25ms", l: "Avg latency" },
            { v: "40+", l: "Languages" },
          ].map((s) => (
            <div key={s.l} className="kt-stat">
              <span className="kt-stat__value">{s.v}</span>
              <span className="kt-stat__label">{s.l}</span>
            </div>
          ))}
        </div>
      </div>

      <a
        href="#features"
        className="kt-hero__scroll-cue"
        aria-label="Scroll to features"
      >
        <ChevronDown size={18} />
      </a>
    </section>
  );
}

/* ─── Features ───────────────────────────────────────────────── */
const FEATURES = [
  {
    Icon: AudioLines,
    title: "Text to Speech",
    desc: "Convert any text into natural-sounding speech. Fine-tune pitch, speed, and emphasis across a curated library of expressive synthetic voices.",
    accent: "#d4af58",
  },
  {
    Icon: Mic,
    title: "Voice Selection",
    desc: "Explore a rich roster of 20+ pre-approved synthetic voices — from warm narrators to crisp announcers — to match your exact creative vision.",
    accent: "#a878f0",
  },
  {
    Icon: Zap,
    title: "Real-time Generation",
    desc: "Generate speech in milliseconds with our optimised inference pipeline. Audio is ready before you finish typing.",
    accent: "#f0d080",
  },
  {
    Icon: Globe,
    title: "Multi-language",
    desc: "Speak to the world with support for 40+ languages and regional accents, all powered by our synthetic voice library.",
    accent: "#58d4c0",
  },
  {
    Icon: Shield,
    title: "Enterprise Security",
    desc: "Your text and audio are encrypted at rest and in transit. We never use your content to train models without explicit consent.",
    accent: "#d4af58",
  },
  {
    Icon: Volume2,
    title: "Studio Quality",
    desc: "Crystal-clear 48 kHz output that sounds natural and expressive. Ideal for podcasts, audiobooks, eLearning, and video production.",
    accent: "#f09060",
  },
];

function Features() {
  return (
    <section id="features" className="kt-features">
      <div className="kt-features__sweep" aria-hidden />
      <div className="kt-features__inner">
        <div className="kt-section-head" data-reveal>
          <p className="kt-eyebrow">Capabilities</p>
          <h2 className="kt-h2">
            Everything you need to
            <br />
            <span className="kt-gradient-text">craft amazing audio</span>
          </h2>
          <p className="kt-section-sub">
            Powerful tools designed for creators, developers, and businesses who
            want professional voice output — instantly.
          </p>
        </div>
        <div className="kt-grid">
          {FEATURES.map(({ Icon, title, desc, accent }, i) => (
            <div
              key={title}
              className="kt-card"
              data-reveal
              style={
                {
                  "--delay": `${i * 70}ms`,
                  "--card-accent": accent,
                } as React.CSSProperties
              }
            >
              <div className="kt-card__bg" aria-hidden />
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
                <Icon size={20} />
              </div>
              <h3 className="kt-card__title">{title}</h3>
              <p className="kt-card__desc">{desc}</p>
              <div className="kt-card__bottom-line" aria-hidden />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── How it works ───────────────────────────────────────────── */
const STEPS = [
  {
    n: "01",
    title: "Enter your text",
    desc: "Paste or type any content — a script, article, dialogue, or announcement.",
    icon: "✦",
  },
  {
    n: "02",
    title: "Choose a voice",
    desc: "Browse our library of pre-approved synthetic voices and pick the one that fits your project.",
    icon: "◈",
  },
  {
    n: "03",
    title: "Generate & export",
    desc: "Click generate and download studio-quality audio in seconds. Ready for any platform.",
    icon: "⬡",
  },
];

function HowItWorks() {
  return (
    <section id="how" className="kt-how">
      <div className="kt-how__fade-top" aria-hidden />
      <div className="kt-how__inner">
        <div className="kt-section-head" data-reveal>
          <p className="kt-eyebrow">Process</p>
          <h2 className="kt-h2">
            From text to audio in
            <br />
            <span className="kt-gradient-text">three steps</span>
          </h2>
        </div>
        <div className="kt-steps">
          {STEPS.map((s, i) => (
            <div
              key={s.n}
              className="kt-step"
              data-reveal
              style={{ "--delay": `${i * 120}ms` } as React.CSSProperties}
            >
              <div className="kt-step__track">
                <div className="kt-step__num">{s.n}</div>
                {i < STEPS.length - 1 && (
                  <div className="kt-step__line" aria-hidden />
                )}
              </div>
              <div className="kt-step__body">
                <div className="kt-step__glyph" aria-hidden>
                  {s.icon}
                </div>
                <h3 className="kt-step__title">{s.title}</h3>
                <p className="kt-step__desc">{s.desc}</p>
              </div>
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
      <div className="kt-cta__aurora" aria-hidden />
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
        <p className="kt-section-sub" data-reveal>
          Join creators and teams already using KingsTalk to produce
          professional audio — no studio required.
        </p>
        <div className="kt-cta__btns" data-reveal>
          <Link href="/sign-up" className="kt-btn kt-btn--primary kt-btn--lg">
            <span className="kt-btn__shine" aria-hidden />
            Start creating free <ArrowRight size={16} />
          </Link>
          <Link href="/sign-in" className="kt-btn kt-btn--ghost kt-btn--lg">
            Sign in
          </Link>
        </div>
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
              width={28}
              height={28}
              className="kt-logo__img"
            />
            <div className="kt-logo__halo" aria-hidden />
          </div>
          <span className="kt-logo__name">KingsTalk</span>
        </div>
        <div className="kt-footer__links">
          <Link href="#features" className="kt-nav__link">
            Features
          </Link>
          <Link href="#how" className="kt-nav__link">
            How it works
          </Link>
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
          <HowItWorks />
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
  --ink:     #030206;
  --ink2:    #06040e;
  --ink3:    #0c0a1a;
  --surface: #110f28;
  --surface2:#18152e;
  --border:  rgba(212,175,88,.11);
  --border2: rgba(212,175,88,.26);
  --muted:   rgba(255,255,255,.44);
  --dim:     rgba(255,255,255,.22);
  --font-display: 'Cinzel', serif;
  --font-body:    'DM Sans', system-ui, sans-serif;

  /* responsive spacing scale */
  --space-xs: clamp(.5rem, 1.5vw, .75rem);
  --space-sm: clamp(.75rem, 2vw, 1.25rem);
  --space-md: clamp(1.25rem, 3vw, 2rem);
  --space-lg: clamp(2rem, 5vw, 4rem);
  --space-xl: clamp(3.5rem, 8vw, 7rem);
  --space-2xl: clamp(5rem, 12vw, 10rem);

  --radius-card: clamp(16px, 2vw, 24px);
  --max-w: 1180px;
  --header-h: 70px;
}

html { scroll-behavior: smooth; }

.kt-root {
  background: var(--ink);
  color: #ede8f5;
  font-family: var(--font-body);
  overflow-x: hidden;
  -webkit-font-smoothing: antialiased;
  position: relative;
}

/* ══════════════════════════════════════
   CURSOR
══════════════════════════════════════ */
.cursor-outer, .cursor-inner {
  position: fixed;
  border-radius: 50%;
  pointer-events: none;
  z-index: 9999;
  transform: translate(-50%, -50%);
}
.cursor-outer {
  width: 44px; height: 44px;
  border: 1px solid rgba(212,175,88,.35);
  transition: width .3s, height .3s, border-color .3s, opacity .3s;
  mix-blend-mode: screen;
}
.cursor-inner {
  width: 5px; height: 5px;
  background: var(--gold2);
  box-shadow: 0 0 14px var(--gold), 0 0 4px var(--gold3);
}
@media (hover: none) {
  .cursor-outer, .cursor-inner { display: none; }
}

/* ══════════════════════════════════════
   NEBULA
══════════════════════════════════════ */
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
  filter: blur(140px);
  mix-blend-mode: screen;
  will-change: transform;
}
.nb1 {
  width: min(1100px, 130vw); height: min(1100px, 130vw);
  background: radial-gradient(circle, rgba(120,60,220,.12) 0%, transparent 65%);
  top: -35%; left: -20%;
  animation: nbdrift 32s ease-in-out infinite;
}
.nb2 {
  width: min(800px, 100vw); height: min(800px, 100vw);
  background: radial-gradient(circle, rgba(212,175,88,.1) 0%, transparent 60%);
  top: 15%; right: -18%;
  animation: nbdrift 26s ease-in-out infinite reverse;
  animation-delay: -8s;
}
.nb3 {
  width: min(700px, 90vw); height: min(700px, 90vw);
  background: radial-gradient(circle, rgba(40,100,255,.08) 0%, transparent 60%);
  bottom: 8%; left: 10%;
  animation: nbdrift 38s ease-in-out infinite;
  animation-delay: -16s;
}
.nb4 {
  width: min(600px, 80vw); height: min(600px, 80vw);
  background: radial-gradient(circle, rgba(200,133,58,.09) 0%, transparent 60%);
  top: 52%; right: 8%;
  animation: nbdrift 22s ease-in-out infinite;
  animation-delay: -5s;
}
.nb5 {
  width: min(450px, 60vw); height: min(450px, 60vw);
  background: radial-gradient(circle, rgba(212,175,88,.06) 0%, transparent 60%);
  bottom: 28%; left: 48%;
  animation: nbdrift 28s ease-in-out infinite reverse;
  animation-delay: -12s;
}
.nb6 {
  width: min(350px, 50vw); height: min(350px, 50vw);
  background: radial-gradient(circle, rgba(168,120,240,.07) 0%, transparent 60%);
  top: 40%; left: 20%;
  animation: nbdrift 18s ease-in-out infinite;
  animation-delay: -3s;
}
@keyframes nbdrift {
  0%,100% { transform: translate(0,0) scale(1); }
  33%      { transform: translate(45px,-30px) scale(1.06); }
  66%      { transform: translate(-30px,22px) scale(.95); }
}
.nebula__grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(212,175,88,.018) 1px, transparent 1px),
    linear-gradient(90deg, rgba(212,175,88,.018) 1px, transparent 1px);
  background-size: 80px 80px;
}
.nebula__vignette {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 80% 60% at 50% 0%, transparent 50%, rgba(3,2,6,.85) 100%),
    radial-gradient(ellipse 70% 50% at 0% 50%, transparent 50%, rgba(3,2,6,.6) 100%),
    radial-gradient(ellipse 70% 50% at 100% 50%, transparent 50%, rgba(3,2,6,.6) 100%);
}

/* ══════════════════════════════════════
   SCROLL REVEAL
══════════════════════════════════════ */
[data-reveal] {
  opacity: 0;
  transform: translateY(32px);
  transition:
    opacity .9s cubic-bezier(.22,1,.36,1) var(--delay, 0ms),
    transform .9s cubic-bezier(.22,1,.36,1) var(--delay, 0ms);
}
[data-reveal].revealed { opacity: 1; transform: none; }

/* ══════════════════════════════════════
   GRADIENT TEXT
══════════════════════════════════════ */
.kt-gradient-text {
  background: linear-gradient(110deg, var(--gold3) 0%, var(--gold2) 35%, var(--gold) 65%, var(--ember) 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  display: inline;
}

/* ══════════════════════════════════════
   HEADER
══════════════════════════════════════ */
.kt-header {
  position: fixed;
  inset-inline: 0;
  top: 0;
  z-index: 200;
  padding: 0 clamp(1rem, 4vw, 2.5rem);
  border-bottom: 1px solid transparent;
  transition: background .4s, border-color .4s, backdrop-filter .4s;
}
.kt-header--scrolled {
  background: rgba(3,2,6,.82);
  backdrop-filter: blur(32px) saturate(160%);
  border-color: var(--border);
}
.kt-header__inner {
  max-width: var(--max-w);
  margin: 0 auto;
  height: var(--header-h);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

/* ── Logo ── */
.kt-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  flex-shrink: 0;
  z-index: 10;
}
.kt-logo__img-wrap { position: relative; line-height: 0; }
.kt-logo__halo {
  position: absolute;
  inset: -7px;
  border-radius: 14px;
  background: rgba(212,175,88,.2);
  filter: blur(12px);
  z-index: -1;
  animation: halo-pulse 3.5s ease-in-out infinite;
}
@keyframes halo-pulse {
  0%,100% { opacity: .35; transform: scale(1); }
  50%      { opacity: .8; transform: scale(1.15); }
}
.kt-logo__img { border-radius: 8px; }
.kt-logo__name {
  font-family: var(--font-display);
  font-size: clamp(.82rem, 2vw, .96rem);
  font-weight: 600;
  letter-spacing: .07em;
  color: #f5edd8;
}

/* ── Desktop Nav ── */
.kt-nav--desktop {
  display: flex;
  align-items: center;
  gap: clamp(.8rem, 2vw, 1.8rem);
}
.kt-nav__link {
  font-size: .84rem;
  color: var(--muted);
  text-decoration: none;
  transition: color .2s;
  letter-spacing: .02em;
  white-space: nowrap;
}
.kt-nav__link:hover { color: var(--gold2); }

/* ── Hamburger ── */
.kt-hamburger {
  display: none;
  flex-direction: column;
  justify-content: center;
  gap: 5px;
  width: 36px;
  height: 36px;
  background: rgba(212,175,88,.06);
  border: 1px solid var(--border);
  border-radius: 10px;
  cursor: pointer;
  padding: 7px 8px;
  z-index: 10;
  transition: background .2s, border-color .2s;
}
.kt-hamburger:hover { background: rgba(212,175,88,.12); border-color: var(--border2); }
.kt-hamburger span {
  display: block;
  height: 1.5px;
  background: var(--gold2);
  border-radius: 2px;
  transition: transform .3s cubic-bezier(.22,1,.36,1), opacity .2s;
  transform-origin: center;
}
.kt-hamburger.is-open span:nth-child(1) { transform: translateY(6.5px) rotate(45deg); }
.kt-hamburger.is-open span:nth-child(2) { opacity: 0; transform: scaleX(0); }
.kt-hamburger.is-open span:nth-child(3) { transform: translateY(-6.5px) rotate(-45deg); }

/* ── Mobile Menu ── */
.kt-mobile-menu {
  position: absolute;
  top: 100%;
  left: 0; right: 0;
  background: rgba(3,2,6,.97);
  backdrop-filter: blur(40px) saturate(160%);
  border-bottom: 1px solid var(--border);
  overflow: hidden;
  max-height: 0;
  transition: max-height .45s cubic-bezier(.22,1,.36,1), border-color .3s;
}
.kt-mobile-menu.is-open {
  max-height: 400px;
  border-color: var(--border2);
}
.kt-mobile-nav {
  display: flex;
  flex-direction: column;
  padding: 1.5rem clamp(1rem, 5vw, 2rem) 2rem;
  gap: .25rem;
}
.kt-mobile-nav__link {
  display: block;
  font-size: 1.1rem;
  color: var(--muted);
  text-decoration: none;
  padding: .85rem 0;
  border-bottom: 1px solid var(--border);
  transition: color .2s, padding-left .2s;
  letter-spacing: .02em;
}
.kt-mobile-nav__link:hover {
  color: var(--gold2);
  padding-left: .5rem;
}
.kt-mobile-cta {
  margin-top: 1.2rem;
  justify-content: center;
  width: 100%;
}

/* ══════════════════════════════════════
   BUTTONS
══════════════════════════════════════ */
.kt-btn {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  text-decoration: none;
  font-family: var(--font-body);
  font-weight: 500;
  border-radius: 100px;
  transition: all .32s cubic-bezier(.22,1,.36,1);
  cursor: pointer;
  white-space: nowrap;
  border: none;
  position: relative;
  overflow: hidden;
  letter-spacing: .01em;
  -webkit-tap-highlight-color: transparent;
}
.kt-btn__shine {
  position: absolute;
  inset: 0;
  background: linear-gradient(105deg, transparent 40%, rgba(255,255,255,.22) 50%, transparent 60%);
  transform: translateX(-120%);
  transition: transform .65s ease;
  pointer-events: none;
}
.kt-btn--primary:hover .kt-btn__shine { transform: translateX(120%); }

.kt-btn--sm {
  font-size: .78rem;
  padding: .44rem 1.15rem;
  background: linear-gradient(135deg, var(--gold2) 0%, var(--gold) 55%, var(--ember) 100%);
  color: #0e0c18;
  font-weight: 600;
  box-shadow: 0 0 22px rgba(212,175,88,.32), 0 2px 16px rgba(0,0,0,.5);
}
.kt-btn--sm:hover {
  transform: translateY(-2px) scale(1.04);
  box-shadow: 0 0 40px rgba(212,175,88,.55), 0 8px 28px rgba(0,0,0,.6);
}
.kt-btn--lg {
  font-size: clamp(.88rem, 2vw, .96rem);
  padding: clamp(.75rem, 2vw, .9rem) clamp(1.4rem, 3.5vw, 2.2rem);
}
.kt-btn--primary {
  background: linear-gradient(135deg, var(--gold3) 0%, var(--gold2) 40%, var(--gold) 70%, var(--ember) 100%);
  color: #0e0c18;
  font-weight: 600;
  box-shadow:
    0 0 0 1px rgba(212,175,88,.28),
    0 0 50px rgba(212,175,88,.26),
    0 12px 48px rgba(0,0,0,.55),
    inset 0 1px 0 rgba(255,255,255,.28);
}
.kt-btn--primary:hover {
  transform: translateY(-3px) scale(1.02);
  box-shadow:
    0 0 0 1px rgba(212,175,88,.5),
    0 0 90px rgba(212,175,88,.48),
    0 22px 70px rgba(0,0,0,.6),
    inset 0 1px 0 rgba(255,255,255,.32);
}
.kt-btn--primary:active { transform: translateY(-1px) scale(1.01); }
.kt-btn--ghost {
  background: rgba(255,255,255,.03);
  color: var(--muted);
  border: 1px solid var(--border);
  backdrop-filter: blur(10px);
}
.kt-btn--ghost:hover {
  background: rgba(212,175,88,.07);
  color: var(--gold2);
  border-color: var(--border2);
  transform: translateY(-2px);
  box-shadow: 0 0 28px rgba(212,175,88,.12);
}
.kt-btn--ghost:active { transform: translateY(0); }

/* ══════════════════════════════════════
   PILL BADGE
══════════════════════════════════════ */
.kt-pill {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: .38rem 1.1rem;
  border-radius: 100px;
  border: 1px solid rgba(212,175,88,.3);
  background: rgba(212,175,88,.055);
  font-size: .71rem;
  color: var(--gold2);
  letter-spacing: .09em;
  text-transform: uppercase;
  margin-bottom: clamp(1.4rem, 3vw, 2.2rem);
  backdrop-filter: blur(16px);
  box-shadow: 0 0 24px rgba(212,175,88,.08), inset 0 1px 0 rgba(255,255,255,.06);
}

/* ══════════════════════════════════════
   HERO
══════════════════════════════════════ */
.kt-hero {
  position: relative;
  min-height: 100svh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: calc(var(--header-h) + var(--space-xl)) clamp(1rem, 5vw, 2rem) var(--space-xl);
  overflow: hidden;
}
.kt-hero::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 120% 75% at 50% -10%, rgba(212,175,88,.09) 0%, transparent 55%),
    radial-gradient(ellipse 55% 50% at 5% 90%, rgba(130,60,220,.07) 0%, transparent 55%),
    radial-gradient(ellipse 45% 38% at 95% 85%, rgba(200,133,58,.06) 0%, transparent 55%);
  pointer-events: none;
}
.kt-hero__glow-center {
  position: absolute;
  width: min(800px, 90vw);
  height: min(800px, 90vw);
  border-radius: 50%;
  background: radial-gradient(circle, rgba(212,175,88,.055) 0%, transparent 65%);
  top: 50%; left: 50%;
  transform: translate(-50%, -55%);
  pointer-events: none;
  filter: blur(40px);
  animation: glow-breathe 10s ease-in-out infinite;
}
@keyframes glow-breathe {
  0%,100% { opacity: .6; transform: translate(-50%, -55%) scale(1); }
  50%      { opacity: 1; transform: translate(-50%, -55%) scale(1.06); }
}
.kt-hero__arc {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  animation: arc-breathe 9s ease-in-out infinite;
}
.kt-hero__arc--1 {
  width: min(620px, 90vw); height: min(620px, 90vw);
  border: 1px solid rgba(212,175,88,.06);
}
.kt-hero__arc--2 {
  width: min(940px, 140vw); height: min(940px, 140vw);
  border: 1px solid rgba(212,175,88,.035);
  animation-delay: -4s; animation-direction: reverse;
}
.kt-hero__arc--3 {
  width: min(1250px, 180vw); height: min(1250px, 180vw);
  border: 1px solid rgba(212,175,88,.018);
  animation-delay: -7s;
}
@keyframes arc-breathe {
  0%,100% { opacity: .5; transform: translate(-50%,-50%) scale(1); }
  50%      { opacity: 1; transform: translate(-50%,-50%) scale(1.02); }
}
.kt-hero__inner {
  position: relative;
  z-index: 1;
  max-width: 900px;
  width: 100%;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.kt-hero__h1 {
  font-family: var(--font-display);
  font-size: clamp(2.6rem, 9vw, 6.4rem);
  font-weight: 700;
  line-height: 1.04;
  letter-spacing: -.015em;
  color: #f8f3e8;
  margin-bottom: clamp(1.1rem, 3vw, 1.8rem);
  text-shadow: 0 0 120px rgba(212,175,88,.12);
}
.kt-hero__sub {
  font-size: clamp(.93rem, 2.2vw, 1.18rem);
  color: var(--muted);
  line-height: 1.85;
  max-width: 560px;
  margin-bottom: clamp(2rem, 4vw, 2.8rem);
  font-weight: 300;
}
.kt-hero__ctas {
  display: flex;
  gap: clamp(.6rem, 2vw, 1rem);
  flex-wrap: wrap;
  justify-content: center;
  margin-bottom: clamp(2.5rem, 5vw, 4rem);
}
.kt-hero__wave-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: .6rem;
  margin-bottom: clamp(2.5rem, 5vw, 4.5rem);
  width: 100%;
}
.kt-hero__wave-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: .68rem;
  letter-spacing: .14em;
  text-transform: uppercase;
  color: rgba(212,175,88,.45);
  font-family: var(--font-display);
}
.kt-hero__wave-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--gold);
  box-shadow: 0 0 8px var(--gold);
  animation: dot-blink 1.8s ease-in-out infinite;
}
@keyframes dot-blink {
  0%,100% { opacity: .4; }
  50%      { opacity: 1; }
}
.kt-hero__scroll-cue {
  position: absolute;
  bottom: clamp(1.2rem, 3vw, 2rem);
  left: 50%;
  transform: translateX(-50%);
  color: rgba(212,175,88,.38);
  animation: scroll-bob 2.4s ease-in-out infinite;
  text-decoration: none;
  transition: color .2s;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px; height: 36px;
  border-radius: 50%;
  border: 1px solid rgba(212,175,88,.15);
}
.kt-hero__scroll-cue:hover { color: var(--gold2); border-color: rgba(212,175,88,.35); }
@keyframes scroll-bob {
  0%,100% { transform: translateX(-50%) translateY(0); opacity: .5; }
  50%      { transform: translateX(-50%) translateY(6px); opacity: 1; }
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
  font-size: clamp(.8rem, 1.3vw, 1.4rem);
  color: rgba(212,175,88,.11);
  animation: rune-float 24s ease-in-out infinite;
  animation-delay: calc(var(--ri) * -1.9s);
  user-select: none;
}
.rune:nth-child(1)  { top: 9%;  left: 6%; }
.rune:nth-child(2)  { top: 19%; left: 90%; }
.rune:nth-child(3)  { top: 56%; left: 4%; }
.rune:nth-child(4)  { top: 72%; left: 88%; }
.rune:nth-child(5)  { top: 36%; left: 2%; }
.rune:nth-child(6)  { top: 13%; left: 76%; }
.rune:nth-child(7)  { top: 82%; left: 13%; }
.rune:nth-child(8)  { top: 46%; left: 94%; }
.rune:nth-child(9)  { top: 63%; left: 46%; }
.rune:nth-child(10) { top: 28%; left: 54%; }
.rune:nth-child(11) { top: 88%; left: 68%; }
.rune:nth-child(12) { top: 5%;  left: 40%; }
@keyframes rune-float {
  0%,100% { transform: translateY(0) rotate(0deg); opacity: .11; }
  25%      { transform: translateY(-18px) rotate(6deg); opacity: .24; }
  50%      { transform: translateY(-8px) rotate(-5deg); opacity: .07; }
  75%      { transform: translateY(-22px) rotate(8deg); opacity: .18; }
}

/* ── Waveform ── */
.wavebars {
  display: flex;
  align-items: center;
  gap: clamp(2px, .5vw, 3.5px);
  height: 56px;
  max-width: 100%;
  overflow: hidden;
}
.wavebar {
  flex-shrink: 0;
  width: clamp(2px, .4vw, 3px);
  border-radius: 5px;
  background: linear-gradient(180deg, var(--gold3), var(--gold), var(--ember));
  animation: wave 1.8s ease-in-out infinite;
  animation-delay: calc(var(--i) * 38ms);
  box-shadow: 0 0 7px rgba(212,175,88,.2);
}
@keyframes wave {
  0%,100% { height: 3px;  opacity: .18; }
  50%      { height: 44px; opacity: 1; }
}

/* ── Stats ── */
.kt-hero__stats {
  display: flex;
  gap: clamp(1.5rem, 4vw, 3.5rem);
  flex-wrap: wrap;
  justify-content: center;
  padding: clamp(1.2rem, 3vw, 1.8rem) clamp(1.5rem, 4vw, 3.2rem);
  border: 1px solid var(--border);
  border-radius: 20px;
  background: rgba(255,255,255,.018);
  backdrop-filter: blur(14px);
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.05),
    0 0 60px rgba(0,0,0,.4),
    0 0 0 1px rgba(0,0,0,.2);
  width: 100%;
  max-width: 700px;
}
.kt-stat { text-align: center; flex: 1; min-width: 80px; }
.kt-stat__value {
  display: block;
  font-family: var(--font-display);
  font-size: clamp(1.6rem, 4vw, 2.3rem);
  font-weight: 700;
  letter-spacing: -.02em;
  background: linear-gradient(135deg, var(--gold3) 0%, var(--gold2) 50%, var(--gold) 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  filter: drop-shadow(0 0 18px rgba(212,175,88,.42));
}
.kt-stat__label {
  display: block;
  font-size: clamp(.62rem, 1.3vw, .7rem);
  color: var(--dim);
  margin-top: 4px;
  letter-spacing: .12em;
  text-transform: uppercase;
}
.kt-stat + .kt-stat {
  border-left: 1px solid var(--border);
  padding-left: clamp(1.5rem, 4vw, 3.5rem);
}

/* ══════════════════════════════════════
   SECTION SHARED
══════════════════════════════════════ */
.kt-section-head {
  text-align: center;
  margin-bottom: clamp(3rem, 6vw, 5rem);
}
.kt-eyebrow {
  font-size: .67rem;
  letter-spacing: .22em;
  text-transform: uppercase;
  color: var(--gold);
  margin-bottom: .9rem;
  font-family: var(--font-display);
}
.kt-h2 {
  font-family: var(--font-display);
  font-size: clamp(1.9rem, 5vw, 3.4rem);
  font-weight: 700;
  line-height: 1.08;
  letter-spacing: -.01em;
  color: #f8f3e8;
  margin-bottom: 1.1rem;
  text-shadow: 0 0 80px rgba(212,175,88,.1);
}
.kt-section-sub {
  font-size: clamp(.92rem, 1.8vw, 1.06rem);
  color: var(--muted);
  line-height: 1.8;
  max-width: 540px;
  margin: 0 auto;
  font-weight: 300;
}

/* ══════════════════════════════════════
   FEATURES
══════════════════════════════════════ */
.kt-features {
  position: relative;
  padding: var(--space-2xl) clamp(1rem, 5vw, 2rem);
  overflow: hidden;
}
.kt-features__sweep {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 60% 40% at 50% 0%, rgba(212,175,88,.04) 0%, transparent 60%),
    radial-gradient(ellipse 50% 40% at 50% 100%, rgba(120,60,220,.04) 0%, transparent 60%);
  pointer-events: none;
}
.kt-features__inner {
  position: relative;
  z-index: 1;
  max-width: var(--max-w);
  margin: 0 auto;
}
.kt-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: clamp(1rem, 2vw, 1.5rem);
}

/* ── Feature card ── */
.kt-card {
  position: relative;
  padding: clamp(1.6rem, 3vw, 2.5rem) clamp(1.4rem, 2.5vw, 2.2rem);
  border-radius: var(--radius-card);
  border: 1px solid var(--border);
  background: linear-gradient(148deg,
    rgba(18,14,38,.98) 0%,
    rgba(6,4,14,.99) 100%);
  overflow: hidden;
  transition: all .42s cubic-bezier(.22,1,.36,1);
  isolation: isolate;
}
.kt-card__bg {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse 80% 60% at 50% 0%, rgba(212,175,88,.025) 0%, transparent 60%);
  opacity: 0;
  transition: opacity .4s;
}
.kt-card:hover .kt-card__bg { opacity: 1; }
.kt-card__glow {
  position: absolute;
  width: 260px; height: 260px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(var(--card-accent-rgb, 212,175,88),.18) 0%, transparent 65%);
  background: radial-gradient(circle, color-mix(in srgb, var(--card-accent) 18%, transparent) 0%, transparent 65%);
  top: -90px; left: -90px;
  pointer-events: none;
  opacity: 0;
  transition: opacity .45s, transform .45s;
  transform: scale(.7);
}
.kt-card:hover .kt-card__glow { opacity: 1; transform: scale(1); }
.kt-card__corner {
  position: absolute;
  width: 16px; height: 16px;
  pointer-events: none;
  opacity: 0;
  transition: opacity .4s;
  border-color: var(--card-accent, var(--gold));
}
.kt-card__corner--tl {
  top: 10px; left: 10px;
  border-top: 1px solid;
  border-left: 1px solid;
  border-radius: 2px 0 0 0;
}
.kt-card__corner--br {
  bottom: 10px; right: 10px;
  border-bottom: 1px solid;
  border-right: 1px solid;
  border-radius: 0 0 2px 0;
}
.kt-card:hover .kt-card__corner { opacity: 1; }
.kt-card__bottom-line {
  position: absolute;
  bottom: 0; left: 20%; right: 20%;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--card-accent, var(--gold)), transparent);
  opacity: 0;
  transition: opacity .4s;
}
.kt-card:hover .kt-card__bottom-line { opacity: .3; }
.kt-card:hover {
  transform: translateY(-8px);
  border-color: rgba(212,175,88,.28);
  box-shadow:
    0 0 0 1px rgba(212,175,88,.07),
    0 32px 100px rgba(0,0,0,.7),
    0 0 80px rgba(212,175,88,.055),
    inset 0 1px 0 rgba(212,175,88,.06);
}
.kt-card__icon {
  width: 50px; height: 50px;
  border-radius: 14px;
  background: linear-gradient(135deg,
    color-mix(in srgb, var(--card-accent) 20%, transparent) 0%,
    color-mix(in srgb, var(--card-accent) 7%, transparent) 100%);
  border: 1px solid color-mix(in srgb, var(--card-accent) 28%, transparent);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--card-accent, var(--gold2));
  margin-bottom: clamp(1.1rem, 2vw, 1.5rem);
  transition: all .3s;
  box-shadow: 0 0 20px color-mix(in srgb, var(--card-accent) 10%, transparent);
}
.kt-card:hover .kt-card__icon {
  border-color: color-mix(in srgb, var(--card-accent) 50%, transparent);
  box-shadow: 0 0 36px color-mix(in srgb, var(--card-accent) 22%, transparent);
  transform: scale(1.05);
}
.kt-card__title {
  font-family: var(--font-display);
  font-size: clamp(.82rem, 1.5vw, .92rem);
  font-weight: 600;
  color: #f5edd8;
  margin-bottom: .7rem;
  letter-spacing: .04em;
}
.kt-card__desc {
  font-size: clamp(.82rem, 1.4vw, .88rem);
  color: var(--muted);
  line-height: 1.8;
  font-weight: 300;
}

/* ══════════════════════════════════════
   HOW IT WORKS
══════════════════════════════════════ */
.kt-how {
  position: relative;
  padding: var(--space-2xl) clamp(1rem, 5vw, 2rem);
  overflow: hidden;
}
.kt-how__fade-top {
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent 0%, rgba(212,175,88,.18) 30%, rgba(212,175,88,.18) 70%, transparent 100%);
}
.kt-how__inner {
  position: relative;
  z-index: 1;
  max-width: 780px;
  margin: 0 auto;
}
.kt-steps {
  display: flex;
  flex-direction: column;
  gap: 0;
}
.kt-step {
  display: grid;
  grid-template-columns: 80px 1fr;
  gap: clamp(1rem, 3vw, 2rem);
  padding: clamp(1.5rem, 3vw, 2.5rem) clamp(1.2rem, 3vw, 2.5rem);
  border-radius: 20px;
  border: 1px solid transparent;
  transition: border-color .3s, background .3s;
  position: relative;
  align-items: flex-start;
}
.kt-step:hover {
  border-color: var(--border);
  background: rgba(212,175,88,.025);
}
.kt-step__track {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
  flex-shrink: 0;
}
.kt-step__num {
  font-family: var(--font-display);
  font-size: clamp(2rem, 4vw, 2.7rem);
  font-weight: 700;
  letter-spacing: -.03em;
  line-height: 1;
  background: linear-gradient(135deg, var(--gold3) 0%, var(--gold2) 50%, var(--gold) 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  filter: drop-shadow(0 0 16px rgba(212,175,88,.35));
  flex-shrink: 0;
}
.kt-step__line {
  width: 1px;
  flex: 1;
  min-height: 40px;
  background: linear-gradient(to bottom, rgba(212,175,88,.22), rgba(212,175,88,.04));
  margin-top: 8px;
  align-self: stretch;
}
.kt-step__body {
  flex: 1;
  padding-top: .15rem;
}
.kt-step__glyph {
  font-size: 1.3rem;
  color: rgba(212,175,88,.2);
  margin-bottom: .5rem;
  line-height: 1;
  transition: color .3s;
}
.kt-step:hover .kt-step__glyph { color: rgba(212,175,88,.4); }
.kt-step__title {
  font-family: var(--font-display);
  font-size: clamp(.92rem, 1.8vw, 1.06rem);
  font-weight: 600;
  color: #f5edd8;
  margin-bottom: .6rem;
  letter-spacing: .03em;
}
.kt-step__desc {
  font-size: clamp(.84rem, 1.5vw, .92rem);
  color: var(--muted);
  line-height: 1.8;
  font-weight: 300;
}

/* ══════════════════════════════════════
   CTA
══════════════════════════════════════ */
.kt-cta {
  position: relative;
  padding: var(--space-2xl) clamp(1rem, 5vw, 2rem);
  text-align: center;
  overflow: hidden;
}
.kt-cta__aurora {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 80% 60% at 50% 50%, rgba(212,175,88,.06) 0%, transparent 60%),
    radial-gradient(ellipse 50% 40% at 20% 60%, rgba(140,60,220,.04) 0%, transparent 55%),
    radial-gradient(ellipse 50% 40% at 80% 40%, rgba(200,133,58,.04) 0%, transparent 55%);
  pointer-events: none;
  animation: aurora-shift 16s ease-in-out infinite;
}
@keyframes aurora-shift {
  0%,100% { opacity: .6; transform: scale(1); }
  50%      { opacity: 1; transform: scale(1.04); }
}
.kt-cta__ring {
  position: absolute;
  top: 50%; left: 50%;
  border-radius: 50%;
  border: 1px solid rgba(212,175,88,.06);
  transform: translate(-50%,-50%);
  pointer-events: none;
  animation: ring-pulse 7s ease-in-out infinite;
}
.kt-cta__ring--1 { width: min(400px, 80vw); height: min(400px, 80vw); animation-delay: 0s; }
.kt-cta__ring--2 { width: min(680px, 130vw); height: min(680px, 130vw); animation-delay: -2.4s; }
.kt-cta__ring--3 { width: min(960px, 180vw); height: min(960px, 180vw); animation-delay: -4.8s; }
@keyframes ring-pulse {
  0%,100% { opacity: .3; transform: translate(-50%,-50%) scale(1); }
  50%      { opacity: .8; transform: translate(-50%,-50%) scale(1.03); }
}
.kt-cta__inner {
  position: relative;
  z-index: 1;
  max-width: 700px;
  margin: 0 auto;
}
.kt-cta .kt-section-sub { margin-bottom: 0; }
.kt-cta__btns {
  display: flex;
  gap: clamp(.6rem, 2vw, 1rem);
  justify-content: center;
  flex-wrap: wrap;
  margin: clamp(2rem, 4vw, 3rem) 0 0;
}

/* ══════════════════════════════════════
   FOOTER
══════════════════════════════════════ */
.kt-footer {
  position: relative;
  padding: clamp(2rem, 4vw, 3rem) clamp(1rem, 5vw, 2rem);
}
.kt-footer__line {
  position: absolute;
  top: 0; left: 8%; right: 8%;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(212,175,88,.2), transparent);
}
.kt-footer__inner {
  max-width: var(--max-w);
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1.5rem;
}
.kt-footer__links { display: flex; gap: clamp(1rem, 3vw, 2rem); flex-wrap: wrap; }
.kt-footer__copy {
  font-size: .76rem;
  color: var(--dim);
  letter-spacing: .02em;
}

/* ══════════════════════════════════════
   MISC
══════════════════════════════════════ */
.kt-br { display: block; }

/* ══════════════════════════════════════
   RESPONSIVE BREAKPOINTS
══════════════════════════════════════ */

/* ── Tablet large (≤1100px): 3→2 grid cols ── */
@media (max-width: 1100px) {
  .kt-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* ── Tablet (≤900px): show hamburger, hide desktop nav ── */
@media (max-width: 900px) {
  .kt-nav--desktop { display: none; }
  .kt-hamburger { display: flex; }

  .kt-step {
    grid-template-columns: 60px 1fr;
  }
}

/* ── Tablet portrait (≤768px) ── */
@media (max-width: 768px) {
  .kt-hero__h1 { font-size: clamp(2.3rem, 10vw, 3.4rem); }

  .kt-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: .85rem;
  }

  .kt-hero__stats {
    gap: 1rem;
    padding: 1.2rem 1.4rem;
  }
  .kt-stat + .kt-stat {
    border-left: 1px solid var(--border);
    padding-left: 1rem;
  }

  .kt-footer__inner {
    flex-direction: column;
    align-items: flex-start;
  }
}

/* ── Mobile (≤540px): single column everything ── */
@media (max-width: 540px) {
  .kt-grid {
    grid-template-columns: 1fr;
    gap: .85rem;
  }

  .kt-hero__h1 { font-size: clamp(2rem, 11vw, 2.8rem); }

  .kt-hero__stats {
    flex-direction: column;
    align-items: center;
    gap: 1.1rem;
    padding: 1.4rem 1.6rem;
  }
  .kt-stat + .kt-stat {
    border-left: none;
    padding-left: 0;
    border-top: 1px solid var(--border);
    padding-top: 1.1rem;
    width: 100%;
  }
  .kt-stat { width: 100%; }

  .kt-hero__ctas { flex-direction: column; align-items: center; width: 100%; }
  .kt-btn--lg { width: 100%; justify-content: center; }

  .kt-step {
    grid-template-columns: 1fr;
    gap: .75rem;
  }
  .kt-step__track {
    flex-direction: row;
    align-items: center;
  }
  .kt-step__line {
    width: 40px;
    height: 1px;
    min-height: unset;
    background: linear-gradient(to right, rgba(212,175,88,.22), rgba(212,175,88,.04));
    margin-top: 0;
    margin-left: 8px;
  }

  .kt-footer__inner { align-items: center; text-align: center; }
  .kt-footer__links { justify-content: center; flex-wrap: wrap; gap: .75rem; }

  .kt-br { display: none; }
  .wavebar:nth-child(n+37) { display: none; }
  .rune { display: none; }

  .kt-cta__btns { flex-direction: column; align-items: center; width: 100%; }

  .kt-hero__wave-wrap { overflow: hidden; }
}

/* ── Tiny mobile (≤380px) ── */
@media (max-width: 380px) {
  .kt-hero__h1 { font-size: 1.9rem; }
  .kt-hero__sub { font-size: .88rem; }
  .wavebar:nth-child(n+29) { display: none; }
}

/* ── Reduced motion ── */
@media (prefers-reduced-motion: reduce) {
  [data-reveal] { opacity: 1; transform: none; transition: none; }
  .wavebar, .nebula__blob, .kt-cta__ring, .rune, .kt-cta__aurora,
  .kt-logo__halo, .kt-hero__scroll-cue, .kt-hero__glow-center,
  .kt-hero__arc, .kt-hero__wave-dot { animation: none !important; }
  .cursor-outer, .cursor-inner { display: none; }
  .kt-btn { transition: background .15s, color .15s; }
  .kt-card { transition: border-color .15s; }
}
`;
// prdtnglaxxx
