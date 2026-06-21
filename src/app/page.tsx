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
    const count = 70;
    const pts = Array.from({ length: count }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 1.2 + 0.3,
      vx: (Math.random() - 0.5) * 0.14,
      vy: (Math.random() - 0.5) * 0.14,
      o: Math.random() * 0.4 + 0.1,
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
      for (let i = 0; i < count; i++) {
        for (let j = i + 1; j < count; j++) {
          const dx = pts[i].x - pts[j].x;
          const dy = pts[i].y - pts[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100) {
            ctx.beginPath();
            ctx.moveTo(pts[i].x, pts[i].y);
            ctx.lineTo(pts[j].x, pts[j].y);
            ctx.strokeStyle = `rgba(212,175,88,${0.1 * (1 - dist / 100)})`;
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
        opacity: 0.65,
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
      {Array.from({ length: 40 }).map((_, i) => (
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
  const glyphs = ["◈", "⬡", "◇", "⊕", "⌬", "◉", "⟡", "⬢", "△", "◎"];
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
      {/* Decorative arc rings */}
      <div className="kt-hero__arc kt-hero__arc--1" aria-hidden />
      <div className="kt-hero__arc kt-hero__arc--2" aria-hidden />

      <div className="kt-hero__inner">
        <div className="kt-pill" data-reveal>
          <Sparkles size={12} />
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
            <Waves size={16} /> See features
          </Link>
        </div>

        <WaveBar />

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

// ⚠️  COMPLIANCE NOTE: Voice Cloning has been removed.
// All features listed below use only pre-approved synthetic voices.
const FEATURES = [
  {
    Icon: AudioLines,
    title: "Text to Speech",
    desc: "Convert any text into natural-sounding speech. Fine-tune pitch, speed, and emphasis across a curated library of expressive synthetic voices.",
  },
  {
    Icon: Mic,
    title: "Voice Selection",
    desc: "Explore a rich roster of 20+ pre-approved synthetic voices — from warm narrators to crisp announcers — to match your exact creative vision.",
  },
  {
    Icon: Zap,
    title: "Real-time Generation",
    desc: "Generate speech in milliseconds with our optimised inference pipeline. Audio is ready before you finish typing.",
  },
  {
    Icon: Globe,
    title: "Multi-language",
    desc: "Speak to the world with support for 40+ languages and regional accents, all powered by our synthetic voice library.",
  },
  {
    Icon: Shield,
    title: "Enterprise Security",
    desc: "Your text and audio are encrypted at rest and in transit. We never use your content to train models without explicit consent.",
  },
  {
    Icon: Volume2,
    title: "Studio Quality",
    desc: "Crystal-clear 48 kHz output that sounds natural and expressive. Ideal for podcasts, audiobooks, eLearning, and video production.",
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
            <span className="kt-gradient-text">craft amazing audio</span>
          </h2>
          <p className="kt-section-sub">
            Powerful tools designed for creators, developers, and businesses who
            want professional voice output — instantly.
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

/* ─── How it works ───────────────────────────────────────────── */
const STEPS = [
  {
    n: "01",
    title: "Enter your text",
    desc: "Paste or type any content — a script, article, dialogue, or announcement.",
  },
  {
    n: "02",
    title: "Choose a voice",
    desc: "Browse our library of pre-approved synthetic voices and pick the one that fits your project.",
  },
  {
    n: "03",
    title: "Generate & export",
    desc: "Click generate and download studio-quality audio in seconds. Ready for any platform.",
  },
];

function HowItWorks() {
  return (
    <section id="how" className="kt-how">
      <div className="kt-how__line" aria-hidden />
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
              <div className="kt-step__num">{s.n}</div>
              <div className="kt-step__body">
                <h3 className="kt-step__title">{s.title}</h3>
                <p className="kt-step__desc">{s.desc}</p>
              </div>
              {i < STEPS.length - 1 && (
                <div className="kt-step__connector" aria-hidden />
              )}
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
              width={26}
              height={26}
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
  --ink:     #040307;
  --ink2:    #080610;
  --ink3:    #0d0b18;
  --surface: #12102a;
  --surface2:#1a1732;
  --border:  rgba(212,175,88,.12);
  --border2: rgba(212,175,88,.28);
  --muted:   rgba(255,255,255,.46);
  --dim:     rgba(255,255,255,.24);
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
  width: 42px; height: 42px;
  border: 1px solid rgba(212,175,88,.4);
  transition: width .25s, height .25s, border-color .25s;
  mix-blend-mode: screen;
}
.cursor-inner {
  width: 6px; height: 6px;
  background: var(--gold2);
  box-shadow: 0 0 12px var(--gold);
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
  filter: blur(130px);
  mix-blend-mode: screen;
}
.nb1 {
  width: 1000px; height: 1000px;
  background: radial-gradient(circle, rgba(140,80,230,.1) 0%, transparent 60%);
  top: -400px; left: -200px;
  animation: nbdrift 30s ease-in-out infinite;
}
.nb2 {
  width: 750px; height: 750px;
  background: radial-gradient(circle, rgba(212,175,88,.09) 0%, transparent 60%);
  top: 20%; right: -220px;
  animation: nbdrift 24s ease-in-out infinite reverse;
  animation-delay: -6s;
}
.nb3 {
  width: 650px; height: 650px;
  background: radial-gradient(circle, rgba(50,120,255,.07) 0%, transparent 60%);
  bottom: 10%; left: 15%;
  animation: nbdrift 34s ease-in-out infinite;
  animation-delay: -14s;
}
.nb4 {
  width: 550px; height: 550px;
  background: radial-gradient(circle, rgba(200,133,58,.08) 0%, transparent 60%);
  top: 55%; right: 12%;
  animation: nbdrift 20s ease-in-out infinite;
  animation-delay: -4s;
}
.nb5 {
  width: 400px; height: 400px;
  background: radial-gradient(circle, rgba(212,175,88,.05) 0%, transparent 60%);
  bottom: 30%; left: 50%;
  animation: nbdrift 26s ease-in-out infinite reverse;
  animation-delay: -10s;
}
@keyframes nbdrift {
  0%,100% { transform: translate(0,0) scale(1); }
  33%      { transform: translate(50px,-35px) scale(1.07); }
  66%      { transform: translate(-35px,25px) scale(.95); }
}

.nebula__grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(212,175,88,.022) 1px, transparent 1px),
    linear-gradient(90deg, rgba(212,175,88,.022) 1px, transparent 1px);
  background-size: 72px 72px;
}

/* ── Scroll reveal ── */
[data-reveal] {
  opacity: 0;
  transform: translateY(28px);
  transition:
    opacity .85s cubic-bezier(.22,1,.36,1) var(--delay, 0ms),
    transform .85s cubic-bezier(.22,1,.36,1) var(--delay, 0ms);
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
  background: rgba(4,3,7,.8);
  backdrop-filter: blur(28px) saturate(160%);
  border-color: var(--border);
}
.kt-header__inner {
  max-width: 1160px;
  margin: 0 auto;
  height: 72px;
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
  background: rgba(212,175,88,.22);
  filter: blur(10px);
  z-index: -1;
  animation: halo-pulse 3.5s ease-in-out infinite;
}
@keyframes halo-pulse {
  0%,100% { opacity: .4; transform: scale(1); }
  50%      { opacity: .85; transform: scale(1.12); }
}
.kt-logo__img { border-radius: 8px; }
.kt-logo__name {
  font-family: var(--font-display);
  font-size: .95rem;
  font-weight: 600;
  letter-spacing: .07em;
  color: #f5edd8;
}

/* ── Nav ── */
.kt-nav { display: flex; align-items: center; gap: 1.6rem; }
.kt-nav__link {
  font-size: .84rem;
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
  background: linear-gradient(105deg, transparent 40%, rgba(255,255,255,.2) 50%, transparent 60%);
  transform: translateX(-100%);
  transition: transform .6s ease;
  pointer-events: none;
}
.kt-btn--primary:hover .kt-btn__shine { transform: translateX(100%); }
.kt-btn--sm {
  font-size: .78rem;
  padding: .42rem 1.2rem;
  background: linear-gradient(135deg, var(--gold2) 0%, var(--gold) 55%, var(--ember) 100%);
  color: #0e0c18;
  font-weight: 600;
  box-shadow: 0 0 20px rgba(212,175,88,.3), 0 2px 14px rgba(0,0,0,.5);
}
.kt-btn--sm:hover {
  transform: translateY(-2px) scale(1.04);
  box-shadow: 0 0 36px rgba(212,175,88,.55), 0 8px 24px rgba(0,0,0,.6);
}
.kt-btn--lg { font-size: .95rem; padding: .85rem 2.1rem; }
.kt-btn--primary {
  background: linear-gradient(135deg, var(--gold3) 0%, var(--gold2) 40%, var(--gold) 70%, var(--ember) 100%);
  color: #0e0c18;
  font-weight: 600;
  box-shadow:
    0 0 0 1px rgba(212,175,88,.3),
    0 0 45px rgba(212,175,88,.28),
    0 12px 44px rgba(0,0,0,.55),
    inset 0 1px 0 rgba(255,255,255,.28);
}
.kt-btn--primary:hover {
  transform: translateY(-3px) scale(1.02);
  box-shadow:
    0 0 0 1px rgba(212,175,88,.55),
    0 0 80px rgba(212,175,88,.5),
    0 22px 64px rgba(0,0,0,.6),
    inset 0 1px 0 rgba(255,255,255,.32);
}
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
  box-shadow: 0 0 24px rgba(212,175,88,.12);
}

/* ── Pill badge ── */
.kt-pill {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: .38rem 1.1rem;
  border-radius: 100px;
  border: 1px solid rgba(212,175,88,.32);
  background: rgba(212,175,88,.06);
  font-size: .74rem;
  color: var(--gold2);
  letter-spacing: .07em;
  text-transform: uppercase;
  margin-bottom: 2rem;
  backdrop-filter: blur(14px);
  box-shadow: 0 0 22px rgba(212,175,88,.09), inset 0 1px 0 rgba(255,255,255,.07);
}

/* ── Hero ── */
.kt-hero {
  position: relative;
  min-height: 100svh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8rem 1.5rem 6rem;
  overflow: hidden;
}
.kt-hero::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 110% 70% at 50% -5%, rgba(212,175,88,.1) 0%, transparent 55%),
    radial-gradient(ellipse 60% 55% at 8% 85%, rgba(140,70,230,.06) 0%, transparent 55%),
    radial-gradient(ellipse 50% 40% at 92% 80%, rgba(200,133,58,.05) 0%, transparent 55%);
  pointer-events: none;
}
.kt-hero__arc {
  position: absolute;
  border-radius: 50%;
  border: 1px solid rgba(212,175,88,.05);
  pointer-events: none;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  animation: arc-breathe 8s ease-in-out infinite;
}
.kt-hero__arc--1 { width: 700px; height: 700px; }
.kt-hero__arc--2 { width: 1050px; height: 1050px; animation-delay: -4s; animation-direction: reverse; }
@keyframes arc-breathe {
  0%,100% { opacity: .4; transform: translate(-50%,-50%) scale(1); }
  50%      { opacity: .9; transform: translate(-50%,-50%) scale(1.02); }
}
.kt-hero__inner {
  position: relative;
  z-index: 1;
  max-width: 900px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.kt-hero__h1 {
  font-family: var(--font-display);
  font-size: clamp(2.9rem, 8vw, 6rem);
  font-weight: 700;
  line-height: 1.05;
  letter-spacing: -.015em;
  color: #f8f3e8;
  margin-bottom: 1.6rem;
  text-shadow: 0 0 100px rgba(212,175,88,.14);
}
.kt-hero__sub {
  font-size: clamp(.96rem, 2.1vw, 1.18rem);
  color: var(--muted);
  line-height: 1.85;
  max-width: 560px;
  margin-bottom: 2.6rem;
  font-weight: 300;
}
.kt-hero__ctas {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  justify-content: center;
  margin-bottom: 3.5rem;
}
.kt-hero__scroll-cue {
  position: absolute;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  color: rgba(212,175,88,.4);
  animation: scroll-bob 2.2s ease-in-out infinite;
  text-decoration: none;
  transition: color .2s;
}
.kt-hero__scroll-cue:hover { color: var(--gold2); }
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
  font-size: clamp(.9rem, 1.4vw, 1.4rem);
  color: rgba(212,175,88,.13);
  animation: rune-float 22s ease-in-out infinite;
  animation-delay: calc(var(--ri) * -2.1s);
  user-select: none;
}
.rune:nth-child(1)  { top: 11%; left: 7%; }
.rune:nth-child(2)  { top: 22%; left: 91%; }
.rune:nth-child(3)  { top: 58%; left: 5%; }
.rune:nth-child(4)  { top: 74%; left: 87%; }
.rune:nth-child(5)  { top: 38%; left: 3%; }
.rune:nth-child(6)  { top: 14%; left: 77%; }
.rune:nth-child(7)  { top: 84%; left: 14%; }
.rune:nth-child(8)  { top: 48%; left: 94%; }
.rune:nth-child(9)  { top: 65%; left: 44%; }
.rune:nth-child(10) { top: 30%; left: 55%; }
@keyframes rune-float {
  0%,100% { transform: translateY(0) rotate(0deg); opacity: .13; }
  25%      { transform: translateY(-16px) rotate(5deg); opacity: .26; }
  50%      { transform: translateY(-7px) rotate(-4deg); opacity: .09; }
  75%      { transform: translateY(-20px) rotate(7deg); opacity: .2; }
}

/* ── Waveform ── */
.wavebars {
  display: flex;
  align-items: center;
  gap: 3px;
  height: 52px;
  margin-bottom: 4rem;
}
.wavebar {
  width: 3px;
  border-radius: 4px;
  background: linear-gradient(180deg, var(--gold3), var(--gold), var(--ember));
  animation: wave 1.7s ease-in-out infinite;
  animation-delay: calc(var(--i) * 42ms);
  box-shadow: 0 0 8px rgba(212,175,88,.25);
}
@keyframes wave {
  0%,100% { height: 4px;  opacity: .22; }
  50%      { height: 40px; opacity: 1; }
}

/* ── Stats ── */
.kt-hero__stats {
  display: flex;
  gap: 3.5rem;
  flex-wrap: wrap;
  justify-content: center;
  padding: 1.8rem 3rem;
  border: 1px solid var(--border);
  border-radius: 20px;
  background: rgba(255,255,255,.02);
  backdrop-filter: blur(12px);
  box-shadow: inset 0 1px 0 rgba(255,255,255,.05);
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
  filter: drop-shadow(0 0 20px rgba(212,175,88,.45));
}
.kt-stat__label {
  display: block;
  font-size: .7rem;
  color: var(--dim);
  margin-top: 4px;
  letter-spacing: .12em;
  text-transform: uppercase;
}
.kt-stat + .kt-stat {
  border-left: 1px solid var(--border);
  padding-left: 3.5rem;
}

/* ── Section shared ── */
.kt-section-head { text-align: center; margin-bottom: 4.5rem; }
.kt-eyebrow {
  font-size: .68rem;
  letter-spacing: .2em;
  text-transform: uppercase;
  color: var(--gold);
  margin-bottom: .9rem;
  font-family: var(--font-display);
}
.kt-h2 {
  font-family: var(--font-display);
  font-size: clamp(2rem, 4.5vw, 3.3rem);
  font-weight: 700;
  line-height: 1.08;
  letter-spacing: -.01em;
  color: #f8f3e8;
  margin-bottom: 1.1rem;
  text-shadow: 0 0 70px rgba(212,175,88,.1);
}
.kt-section-sub {
  font-size: 1.05rem;
  color: var(--muted);
  line-height: 1.8;
  max-width: 530px;
  margin: 0 auto;
  font-weight: 300;
}

/* ── Features ── */
.kt-features {
  position: relative;
  padding: 9rem 1.5rem;
  overflow: hidden;
}
.kt-features__arc {
  position: absolute;
  top: 50%; left: 50%;
  transform: translate(-50%,-50%);
  width: 960px; height: 960px;
  border-radius: 50%;
  border: 1px solid rgba(212,175,88,.035);
  pointer-events: none;
}
.kt-features__arc::before {
  content: '';
  position: absolute;
  inset: -90px;
  border-radius: 50%;
  border: 1px solid rgba(212,175,88,.02);
}
.kt-features__inner {
  position: relative;
  z-index: 1;
  max-width: 1160px;
  margin: 0 auto;
}
.kt-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 1.5rem;
}

/* ── Feature card ── */
.kt-card {
  position: relative;
  padding: 2.4rem 2.2rem;
  border-radius: 22px;
  border: 1px solid var(--border);
  background: linear-gradient(148deg,
    rgba(20,16,40,.96) 0%,
    rgba(8,6,16,.98) 100%);
  overflow: hidden;
  transition: all .4s cubic-bezier(.22,1,.36,1);
  isolation: isolate;
}
.kt-card__glow {
  position: absolute;
  width: 240px; height: 240px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(212,175,88,.16) 0%, transparent 65%);
  top: -80px; left: -80px;
  pointer-events: none;
  opacity: 0;
  transition: opacity .45s, transform .45s;
  transform: scale(.75);
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
  top: 10px; left: 10px;
  border-top: 1px solid var(--gold);
  border-left: 1px solid var(--gold);
  border-radius: 2px 0 0 0;
}
.kt-card__corner--br {
  bottom: 10px; right: 10px;
  border-bottom: 1px solid var(--gold);
  border-right: 1px solid var(--gold);
  border-radius: 0 0 2px 0;
}
.kt-card:hover .kt-card__corner { opacity: 1; }
.kt-card:hover {
  transform: translateY(-7px);
  border-color: rgba(212,175,88,.32);
  box-shadow:
    0 0 0 1px rgba(212,175,88,.09),
    0 28px 90px rgba(0,0,0,.75),
    0 0 70px rgba(212,175,88,.07),
    inset 0 1px 0 rgba(212,175,88,.06);
}
.kt-card__icon {
  width: 48px; height: 48px;
  border-radius: 14px;
  background: linear-gradient(135deg, rgba(212,175,88,.18) 0%, rgba(212,175,88,.06) 100%);
  border: 1px solid rgba(212,175,88,.22);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--gold2);
  margin-bottom: 1.5rem;
  transition: all .3s;
  box-shadow: 0 0 22px rgba(212,175,88,.09);
}
.kt-card:hover .kt-card__icon {
  border-color: rgba(212,175,88,.45);
  box-shadow: 0 0 32px rgba(212,175,88,.22);
  background: linear-gradient(135deg, rgba(212,175,88,.24) 0%, rgba(212,175,88,.09) 100%);
}
.kt-card__title {
  font-family: var(--font-display);
  font-size: .9rem;
  font-weight: 600;
  color: #f5edd8;
  margin-bottom: .7rem;
  letter-spacing: .03em;
}
.kt-card__desc {
  font-size: .875rem;
  color: var(--muted);
  line-height: 1.78;
  font-weight: 300;
}

/* ── How it works ── */
.kt-how {
  position: relative;
  padding: 8rem 1.5rem;
  overflow: hidden;
}
.kt-how__line {
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent 0%, rgba(212,175,88,.15) 30%, rgba(212,175,88,.15) 70%, transparent 100%);
}
.kt-how__inner {
  position: relative;
  z-index: 1;
  max-width: 900px;
  margin: 0 auto;
}
.kt-steps {
  display: flex;
  flex-direction: column;
  gap: 0;
  position: relative;
}
.kt-step {
  display: flex;
  align-items: flex-start;
  gap: 2rem;
  padding: 2.5rem 2.5rem;
  border-radius: 20px;
  border: 1px solid transparent;
  transition: border-color .3s, background .3s;
  position: relative;
}
.kt-step:hover {
  border-color: var(--border);
  background: rgba(255,255,255,.018);
}
.kt-step__num {
  font-family: var(--font-display);
  font-size: 2.6rem;
  font-weight: 700;
  letter-spacing: -.03em;
  line-height: 1;
  min-width: 72px;
  background: linear-gradient(135deg, var(--gold3) 0%, var(--gold2) 50%, var(--gold) 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  filter: drop-shadow(0 0 16px rgba(212,175,88,.35));
  flex-shrink: 0;
  padding-top: .1rem;
}
.kt-step__body { flex: 1; }
.kt-step__title {
  font-family: var(--font-display);
  font-size: 1.05rem;
  font-weight: 600;
  color: #f5edd8;
  margin-bottom: .6rem;
  letter-spacing: .03em;
}
.kt-step__desc {
  font-size: .9rem;
  color: var(--muted);
  line-height: 1.78;
  font-weight: 300;
}
.kt-step__connector {
  position: absolute;
  left: calc(2.5rem + 36px);
  bottom: -1px;
  width: 1px;
  height: calc(100% - 4.8rem);
  background: linear-gradient(to bottom, rgba(212,175,88,.22), rgba(212,175,88,.05));
  bottom: 0;
  transform: translateY(100%);
  height: 2.5rem;
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
.kt-cta__ring--1 { width: 420px; height: 420px; animation-delay: 0s; }
.kt-cta__ring--2 { width: 700px; height: 700px; animation-delay: -2s; }
.kt-cta__ring--3 { width: 980px; height: 980px; animation-delay: -4s; }
@keyframes ring-pulse {
  0%,100% { opacity: .35; transform: translate(-50%,-50%) scale(1); }
  50%      { opacity: .85; transform: translate(-50%,-50%) scale(1.03); }
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
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
  margin: 2.8rem 0 0;
}

/* ── Footer ── */
.kt-footer { position: relative; padding: 3rem 1.5rem; }
.kt-footer__line {
  position: absolute;
  top: 0; left: 8%; right: 8%;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(212,175,88,.22), transparent);
}
.kt-footer__inner {
  max-width: 1160px;
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
@media (max-width: 768px) {
  .kt-nav .kt-nav__link:not(:last-of-type) { display: none; }
}
@media (max-width: 640px) {
  .kt-hero__h1 { font-size: 2.5rem; }
  .kt-hero__stats { gap: 1.5rem; padding: 1.4rem 1.8rem; flex-direction: column; align-items: center; }
  .kt-stat + .kt-stat { border-left: none; padding-left: 0; border-top: 1px solid var(--border); padding-top: 1.5rem; }
  .kt-footer__inner { flex-direction: column; text-align: center; }
  .kt-footer__links { justify-content: center; }
  .kt-br { display: none; }
  .wavebars { gap: 2px; }
  .wavebar { width: 2.5px; }
  .rune { display: none; }
  .kt-step { flex-direction: column; gap: 1rem; }
  .kt-step__connector { display: none; }
}

/* ── Reduced motion ── */
@media (prefers-reduced-motion: reduce) {
  [data-reveal] { opacity: 1; transform: none; transition: none; }
  .wavebar, .nebula__blob, .kt-cta__ring, .rune,
  .kt-logo__halo, .kt-hero__scroll-cue,
  .kt-hero__arc { animation: none; }
  .cursor-outer, .cursor-inner { display: none; }
}
`;
// prdtnglaxxx
