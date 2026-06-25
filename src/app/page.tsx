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
      { threshold: 0.08 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

/* ─── Advanced Particle Field ──────────────────────────────────── */
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
    const count = 120;
    const pts = Array.from({ length: count }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 2.2 + 0.3,
      vx: (Math.random() - 0.5) * 0.15,
      vy: (Math.random() - 0.5) * 0.15,
      o: Math.random() * 0.45 + 0.12,
      pulse: Math.random() * Math.PI * 2,
      hue: Math.random() * 60,
    }));
    let frame: number;
    const draw = (t: number) => {
      ctx.clearRect(0, 0, W, H);
      pts.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.pulse += 0.014;
        if (p.x < -10) p.x = W + 10;
        if (p.x > W + 10) p.x = -10;
        if (p.y < -10) p.y = H + 10;
        if (p.y > H + 10) p.y = -10;
        const alpha = p.o * (0.6 + 0.4 * Math.sin(p.pulse));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        const hueShift = (p.hue + Math.sin(t * 0.001) * 30) % 360;
        ctx.fillStyle = `hsla(${hueShift}, 85%, 60%, ${alpha * 0.8})`;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 2.5, 0, Math.PI * 2);
        ctx.strokeStyle = `hsla(${hueShift}, 85%, 60%, ${alpha * 0.15})`;
        ctx.lineWidth = 0.8;
        ctx.stroke();
      });
      for (let i = 0; i < count; i++) {
        for (let j = i + 1; j < count; j++) {
          const dx = pts[i].x - pts[j].x;
          const dy = pts[i].y - pts[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 140) {
            ctx.beginPath();
            ctx.moveTo(pts[i].x, pts[i].y);
            ctx.lineTo(pts[j].x, pts[j].y);
            const hueAvg = (pts[i].hue + pts[j].hue) / 2;
            ctx.strokeStyle = `hsla(${hueAvg}, 85%, 60%, ${0.06 * (1 - dist / 140)})`;
            ctx.lineWidth = 0.6;
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
        opacity: 0.65,
      }}
    />
  );
}

/* ─── Dynamic Nebula Background ───────────────────────────────── */
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

/* ─── Premium Cursor ──────────────────────────────────────── */
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
      lag.current.x += (pos.current.x - lag.current.x) * 0.1;
      lag.current.y += (pos.current.y - lag.current.y) * 0.1;
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

/* ─── Enhanced Waveform ───────────────────────────────────────── */
function WaveBar() {
  return (
    <div className="wavebars" aria-hidden>
      {Array.from({ length: 56 }).map((_, i) => (
        <span
          key={i}
          className="wavebar"
          style={{ "--i": i } as React.CSSProperties}
        />
      ))}
    </div>
  );
}

/* ─── Floating Rune Glyphs ────────────────────────────────────── */
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

/* ─── Premium Header ──────────────────────────────────────────── */
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
          <Link href="#pricing" className="kt-nav__link">
            Pricing
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
            href="#pricing"
            className="kt-mobile-nav__link"
            onClick={() => setMenuOpen(false)}
          >
            Pricing
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

/* ─── Dramatic Hero ───────────────────────────────────────────── */
function Hero() {
  return (
    <section className="kt-hero">
      <Runes />
      <div className="kt-hero__arc kt-hero__arc--1" aria-hidden />
      <div className="kt-hero__arc kt-hero__arc--2" aria-hidden />
      <div className="kt-hero__arc kt-hero__arc--3" aria-hidden />
      <div className="kt-hero__glow-center" aria-hidden />
      <div className="kt-hero__glow-accent" aria-hidden />

      <div className="kt-hero__inner">
        <div className="kt-pill" data-reveal>
          <Sparkles size={11} />
          <span>The future of voice synthesis</span>
        </div>

        <h1 className="kt-hero__h1" data-reveal>
          Your words,
          <br />
          <span className="kt-gradient-text">flawlessly amplified</span>
        </h1>

        <p className="kt-hero__sub" data-reveal>
          Professional AI-powered text-to-speech that sounds genuinely human.
          <br className="kt-br" />
          Studio quality across 40+ languages with zero compromise.
        </p>

        <div className="kt-hero__ctas" data-reveal>
          <Link href="/sign-up" className="kt-btn kt-btn--primary kt-btn--lg">
            <span className="kt-btn__shine" aria-hidden />
            Start creating free <ArrowRight size={16} />
          </Link>
          <Link href="#features" className="kt-btn kt-btn--ghost kt-btn--lg">
            <Waves size={15} /> Explore features
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
            { v: "20+", l: "Studio voices" },
            { v: "99.9%", l: "Uptime" },
            { v: "15ms", l: "Latency" },
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

/* ─── Premium Features ───────────────────────────────────────── */
const FEATURES = [
  {
    Icon: AudioLines,
    title: "Crystal-Clear Audio",
    desc: "48 kHz studio-quality output with zero artifacts. Every word sounds natural, expressive, and professional.",
    accent: "hsl(48, 100%, 55%)",
  },
  {
    Icon: Mic,
    title: "20+ Curated Voices",
    desc: "Handpicked synthetic voices from warm narrators to crisp announcers. Each trained for maximum expressiveness.",
    accent: "hsl(280, 100%, 55%)",
  },
  {
    Icon: Zap,
    title: "Lightning Fast",
    desc: "15ms average latency. Generate speech in real-time as you type—optimized inference at scale.",
    accent: "hsl(48, 100%, 65%)",
  },
  {
    Icon: Globe,
    title: "Truly Global",
    desc: "40+ languages with native accent support. Break language barriers and reach every market.",
    accent: "hsl(160, 100%, 50%)",
  },
  {
    Icon: Shield,
    title: "Bank-Grade Security",
    desc: "AES-256 encryption at rest and in transit. Your content is yours—we never use it for training.",
    accent: "hsl(48, 100%, 55%)",
  },
  {
    Icon: Volume2,
    title: "Infinite Scale",
    desc: "From single videos to millions of hours. Auto-scaling infrastructure with predictable pricing.",
    accent: "hsl(15, 100%, 55%)",
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
            Everything creators
            <br />
            <span className="kt-gradient-text">actually need</span>
          </h2>
          <p className="kt-section-sub">
            Built by teams who ship. Designed for professionals who demand
            perfection.
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
                  "--delay": `${i * 60}ms`,
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
                <Icon size={22} />
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

/* ─── How It Works ───────────────────────────────────────────── */
const STEPS = [
  {
    n: "01",
    title: "Paste your text",
    desc: "Scripts, articles, emails, or raw ideas. Paste anything and start playing.",
    icon: "✦",
  },
  {
    n: "02",
    title: "Pick your voice",
    desc: "Choose from 20+ expressive voices. Preview instantly. Adjust pitch, speed, and emphasis.",
    icon: "◈",
  },
  {
    n: "03",
    title: "Export to anywhere",
    desc: "Download MP3, WAV, or stream directly to your app. Works everywhere in seconds.",
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
            Three steps to
            <br />
            <span className="kt-gradient-text">professional audio</span>
          </h2>
        </div>
        <div className="kt-steps">
          {STEPS.map((s, i) => (
            <div
              key={s.n}
              className="kt-step"
              data-reveal
              style={{ "--delay": `${i * 100}ms` } as React.CSSProperties}
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

/* ─── Pricing Section ───────────────────────────────────────── */
const PRICING_PLANS = [
  {
    id: "free",
    name: "Free",
    price: 0,
    period: "mo",
    desc: "Perfect for trying out KingsTalk.",
    features: [
      "10,000 characters/month",
      "2,000 characters per generation",
      "0 custom voice clones",
      "Standard voice library",
      "Email support",
    ],
    cta: "Start Free",
    popular: false,
    accent: "hsl(160, 100%, 50%)",
  },
  {
    id: "starter",
    name: "Starter",
    price: 9,
    period: "mo",
    desc: "Perfect for individual creators getting started.",
    features: [
      "100,000 characters/month",
      "3,000 characters per generation",
      "1 custom voice clone",
      "Standard voice library",
      "MP3 & WAV export",
      "Email support",
    ],
    cta: "Start with Starter",
    popular: false,
    accent: "hsl(48, 100%, 55%)",
  },
  {
    id: "creator",
    name: "Creator",
    price: 19,
    period: "mo",
    desc: "For content creators who need more power and voices.",
    features: [
      "500,000 characters/month",
      "15,000 characters per generation",
      "5 custom voice clones",
      "Premium voice library",
      "MP3, WAV & streaming",
      "Priority email support",
      "Advanced voice settings",
    ],
    cta: "Start Creating",
    popular: true,
    accent: "hsl(280, 100%, 65%)",
  },
  {
    id: "pro",
    name: "Pro",
    price: 49,
    period: "mo",
    desc: "For agencies and teams demanding unlimited scale.",
    features: [
      "2,000,000 characters/month",
      "50,000 characters per generation",
      "Unlimited voice clones",
      "Premium voice library",
      "MP3, WAV & streaming",
      "Dedicated support",
      "API access",
      "Team collaboration",
    ],
    cta: "Go Pro",
    popular: false,
    accent: "hsl(15, 100%, 60%)",
  },
];

function Pricing() {
  return (
    <section id="pricing" className="kt-pricing">
      <div className="kt-pricing__sweep" aria-hidden />
      <div className="kt-pricing__inner">
        <div className="kt-section-head" data-reveal>
          <p className="kt-eyebrow">Simple pricing</p>
          <h2 className="kt-h2">
            One plan for every
            <br />
            <span className="kt-gradient-text">stage of growth</span>
          </h2>
          <p className="kt-section-sub">
            No hidden fees. No surprise bills. Cancel anytime.
          </p>
        </div>

        <div className="kt-pricing__grid">
          {PRICING_PLANS.map((plan, i) => (
            <div
              key={plan.id}
              className={`kt-price-card${
                plan.popular ? " kt-price-card--popular" : ""
              }`}
              data-reveal
              style={
                {
                  "--delay": `${i * 80}ms`,
                  "--price-accent": plan.accent,
                } as React.CSSProperties
              }
            >
              {plan.popular && (
                <div className="kt-price-card__badge">Most Popular</div>
              )}
              <div className="kt-price-card__bg" aria-hidden />
              <div className="kt-price-card__glow" aria-hidden />

              <div className="kt-price-card__header">
                <p className="kt-price-card__name">{plan.name}</p>
                <p className="kt-price-card__desc">{plan.desc}</p>
              </div>

              <div className="kt-price-card__price-row">
                <span className="kt-price-card__currency">$</span>
                <span className="kt-price-card__amount">{plan.price}</span>
                <span className="kt-price-card__per">/{plan.period}</span>
              </div>

              <ul className="kt-price-card__features">
                {plan.features.map((f) => (
                  <li key={f} className="kt-price-card__feature">
                    <span className="kt-price-card__check" aria-hidden>
                      ✓
                    </span>
                    {f}
                  </li>
                ))}
              </ul>

              <Link
                href="/sign-up"
                className={`kt-price-card__cta${
                  plan.popular
                    ? " kt-btn kt-btn--primary"
                    : " kt-btn kt-btn--ghost"
                }`}
              >
                {plan.popular && <span className="kt-btn__shine" aria-hidden />}
                {plan.cta} <ArrowRight size={14} />
              </Link>
            </div>
          ))}
        </div>

        <p className="kt-pricing__note" data-reveal>
          All plans include a 7-day free trial. No credit card required to
          start.
        </p>
      </div>
    </section>
  );
}

/* ─── Premium CTA ────────────────────────────────────────────── */
function CTA() {
  return (
    <section className="kt-cta">
      <div className="kt-cta__aurora" aria-hidden />
      <div className="kt-cta__ring kt-cta__ring--1" aria-hidden />
      <div className="kt-cta__ring kt-cta__ring--2" aria-hidden />
      <div className="kt-cta__ring kt-cta__ring--3" aria-hidden />
      <div className="kt-cta__inner">
        <p className="kt-eyebrow" data-reveal>
          Join the future
        </p>
        <h2 className="kt-h2" data-reveal>
          Stop searching for
          <br />
          <span className="kt-gradient-text">perfect voice</span>
        </h2>
        <p className="kt-section-sub" data-reveal>
          Thousands of creators and teams use KingsTalk to scale audio
          production. No setup, no studio, just results.
        </p>
        <div className="kt-cta__btns" data-reveal>
          <Link href="/sign-up" className="kt-btn kt-btn--primary kt-btn--lg">
            <span className="kt-btn__shine" aria-hidden />
            Start free today <ArrowRight size={16} />
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
          <Link href="#pricing" className="kt-nav__link">
            Pricing
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
          <Pricing />
          <CTA />
        </main>
        <Footer />
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PREMIUM CSS - DRAMATICALLY ENHANCED
═══════════════════════════════════════════════════════════════ */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --gold:    #d4af58;
  --gold2:   #f0d080;
  --gold3:   #fff0b0;
  --ember:   #c8853a;
  --cyan:    #00d4ff;
  --purple:  #a878f0;
  --ink:     #030206;
  --ink2:    #06040e;
  --ink3:    #0c0a1a;
  --surface: #110f28;
  --surface2:#18152e;
  --surface3: #1f1a38;
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

  --radius-card: clamp(16px, 2vw, 28px);
  --max-w: 1280px;
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
   CURSOR - PREMIUM
══════════════════════════════════════ */
.cursor-outer, .cursor-inner {
  position: fixed;
  border-radius: 50%;
  pointer-events: none;
  z-index: 9999;
  transform: translate(-50%, -50%);
}
.cursor-outer {
  width: 52px; height: 52px;
  border: 1.5px solid rgba(212,175,88,.42);
  transition: width .4s, height .4s, border-color .4s, opacity .4s, box-shadow .4s;
  mix-blend-mode: screen;
  box-shadow: 0 0 0 1px rgba(0,255,212,.15);
}
.cursor-inner {
  width: 6px; height: 6px;
  background: var(--gold2);
  box-shadow: 0 0 18px var(--gold), 0 0 8px var(--gold3), 0 0 2px #fff;
  border-radius: 50%;
}
@media (hover: none) {
  .cursor-outer, .cursor-inner { display: none; }
}

/* ══════════════════════════════════════
   NEBULA - ENHANCED
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
  filter: blur(160px);
  mix-blend-mode: screen;
  will-change: transform;
}
.nb1 {
  width: min(1100px, 130vw); height: min(1100px, 130vw);
  background: radial-gradient(circle, rgba(120,60,220,.15) 0%, transparent 65%);
  top: -35%; left: -20%;
  animation: nbdrift 36s ease-in-out infinite;
}
.nb2 {
  width: min(800px, 100vw); height: min(800px, 100vw);
  background: radial-gradient(circle, rgba(212,175,88,.12) 0%, transparent 60%);
  top: 15%; right: -18%;
  animation: nbdrift 28s ease-in-out infinite reverse;
  animation-delay: -8s;
}
.nb3 {
  width: min(700px, 90vw); height: min(700px, 90vw);
  background: radial-gradient(circle, rgba(0,212,255,.1) 0%, transparent 60%);
  bottom: 8%; left: 10%;
  animation: nbdrift 42s ease-in-out infinite;
  animation-delay: -16s;
}
.nb4 {
  width: min(600px, 80vw); height: min(600px, 80vw);
  background: radial-gradient(circle, rgba(200,133,58,.11) 0%, transparent 60%);
  top: 52%; right: 8%;
  animation: nbdrift 24s ease-in-out infinite;
  animation-delay: -5s;
}
.nb5 {
  width: min(450px, 60vw); height: min(450px, 60vw);
  background: radial-gradient(circle, rgba(168,120,240,.08) 0%, transparent 60%);
  bottom: 28%; left: 48%;
  animation: nbdrift 32s ease-in-out infinite reverse;
  animation-delay: -12s;
}
.nb6 {
  width: min(350px, 50vw); height: min(350px, 50vw);
  background: radial-gradient(circle, rgba(168,120,240,.09) 0%, transparent 60%);
  top: 40%; left: 20%;
  animation: nbdrift 20s ease-in-out infinite;
  animation-delay: -3s;
}
@keyframes nbdrift {
  0%,100% { transform: translate(0,0) scale(1); }
  33%      { transform: translate(55px,-40px) scale(1.08); }
  66%      { transform: translate(-40px,28px) scale(.94); }
}
.nebula__grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(212,175,88,.012) 1px, transparent 1px),
    linear-gradient(90deg, rgba(212,175,88,.012) 1px, transparent 1px);
  background-size: 100px 100px;
}
.nebula__vignette {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 100% 70% at 50% 0%, transparent 40%, rgba(3,2,6,.9) 100%),
    radial-gradient(ellipse 75% 55% at 0% 50%, transparent 50%, rgba(3,2,6,.7) 100%),
    radial-gradient(ellipse 75% 55% at 100% 50%, transparent 50%, rgba(3,2,6,.7) 100%);
}

/* ══════════════════════════════════════
   SCROLL REVEAL - REFINED
══════════════════════════════════════ */
[data-reveal] {
  opacity: 0;
  transform: translateY(36px);
  transition:
    opacity 1s cubic-bezier(.16,1,.3,1) var(--delay, 0ms),
    transform 1s cubic-bezier(.16,1,.3,1) var(--delay, 0ms);
}
[data-reveal].revealed { opacity: 1; transform: none; }

/* ══════════════════════════════════════
   GRADIENT TEXT - LUXURY
══════════════════════════════════════ */
.kt-gradient-text {
  background: linear-gradient(115deg, 
    #fff0b0 0%, 
    #f0d080 28%, 
    #d4af58 55%, 
    #c8853a 75%, 
    #b8653a 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  display: inline;
  animation: gradient-shift 8s ease-in-out infinite;
  background-size: 200% 200%;
}
@keyframes gradient-shift {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

/* ══════════════════════════════════════
   HEADER - PREMIUM
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
  background: rgba(3,2,6,.88);
  backdrop-filter: blur(40px) saturate(180%) brightness(1.05);
  border-color: rgba(212,175,88,.18);
  box-shadow: 0 4px 32px rgba(0,0,0,.4);
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
  inset: -9px;
  border-radius: 16px;
  background: rgba(212,175,88,.25);
  filter: blur(16px);
  z-index: -1;
  animation: halo-pulse 3.2s cubic-bezier(.34,1.56,.64,1) infinite;
}
@keyframes halo-pulse {
  0%,100% { opacity: .4; transform: scale(1); }
  50%      { opacity: 1; transform: scale(1.22); }
}
.kt-logo__img { border-radius: 8px; }
.kt-logo__name {
  font-family: var(--font-display);
  font-size: clamp(.82rem, 2vw, .98rem);
  font-weight: 700;
  letter-spacing: .1em;
  color: #fff;
  text-shadow: 0 0 32px rgba(212,175,88,.2);
}

/* ── Desktop Nav ── */
.kt-nav--desktop {
  display: flex;
  align-items: center;
  gap: clamp(.8rem, 2vw, 1.8rem);
}
.kt-nav__link {
  font-size: .85rem;
  color: var(--muted);
  text-decoration: none;
  transition: all .3s cubic-bezier(.34,1.56,.64,1);
  letter-spacing: .03em;
  white-space: nowrap;
  position: relative;
}
.kt-nav__link::after {
  content: '';
  position: absolute;
  bottom: -4px;
  left: 0;
  width: 0;
  height: 2px;
  background: linear-gradient(90deg, var(--gold), var(--gold3));
  transition: width .4s cubic-bezier(.34,1.56,.64,1);
}
.kt-nav__link:hover {
  color: var(--gold2);
}
.kt-nav__link:hover::after { width: 100%; }

/* ── Hamburger ── */
.kt-hamburger {
  display: none;
  flex-direction: column;
  justify-content: center;
  gap: 5px;
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, rgba(212,175,88,.08), rgba(168,120,240,.05));
  border: 1px solid var(--border2);
  border-radius: 12px;
  cursor: pointer;
  padding: 8px;
  z-index: 10;
  transition: all .3s cubic-bezier(.34,1.56,.64,1);
}
.kt-hamburger:hover {
  background: linear-gradient(135deg, rgba(212,175,88,.15), rgba(168,120,240,.1));
  border-color: rgba(212,175,88,.4);
  box-shadow: 0 0 20px rgba(212,175,88,.1);
}
.kt-hamburger span {
  display: block;
  height: 1.5px;
  background: var(--gold2);
  border-radius: 2px;
  transition: transform .35s cubic-bezier(.34,1.56,.64,1), opacity .2s;
  transform-origin: center;
}
.kt-hamburger.is-open span:nth-child(1) { transform: translateY(8px) rotate(45deg); }
.kt-hamburger.is-open span:nth-child(2) { opacity: 0; transform: scaleX(0); }
.kt-hamburger.is-open span:nth-child(3) { transform: translateY(-8px) rotate(-45deg); }

/* ── Mobile Menu ── */
.kt-mobile-menu {
  position: absolute;
  top: 100%;
  left: 0; right: 0;
  background: linear-gradient(180deg, rgba(3,2,6,.95) 0%, rgba(6,4,14,.98) 100%);
  backdrop-filter: blur(50px) saturate(200%);
  border-bottom: 1px solid var(--border);
  overflow: hidden;
  max-height: 0;
  transition: max-height .45s cubic-bezier(.34,1.56,.64,1), border-color .3s;
}
.kt-mobile-menu.is-open {
  max-height: 420px;
  border-color: var(--border2);
}
.kt-mobile-nav {
  display: flex;
  flex-direction: column;
  padding: 1.8rem clamp(1rem, 5vw, 2rem) 2.2rem;
  gap: .25rem;
}
.kt-mobile-nav__link {
  display: block;
  font-size: 1.05rem;
  color: var(--muted);
  text-decoration: none;
  padding: .95rem 0;
  border-bottom: 1px solid var(--border);
  transition: all .3s cubic-bezier(.34,1.56,.64,1);
  letter-spacing: .02em;
}
.kt-mobile-nav__link:hover {
  color: var(--gold2);
  padding-left: .6rem;
  border-color: var(--border2);
}
.kt-mobile-cta {
  margin-top: 1.4rem;
  justify-content: center;
  width: 100%;
}

/* ══════════════════════════════════════
   BUTTONS - ENHANCED
══════════════════════════════════════ */
.kt-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  font-family: var(--font-body);
  font-weight: 600;
  border-radius: 12px;
  transition: all .35s cubic-bezier(.34,1.56,.64,1);
  cursor: pointer;
  white-space: nowrap;
  border: none;
  position: relative;
  overflow: hidden;
  letter-spacing: .02em;
  -webkit-tap-highlight-color: transparent;
}
.kt-btn__shine {
  position: absolute;
  inset: 0;
  background: linear-gradient(105deg, transparent 35%, rgba(255,255,255,.28) 50%, transparent 65%);
  transform: translateX(-130%);
  transition: transform .7s cubic-bezier(.34,1.56,.64,1);
  pointer-events: none;
}
.kt-btn--primary:hover .kt-btn__shine,
.kt-btn--primary:focus .kt-btn__shine { transform: translateX(130%); }

.kt-btn--sm {
  font-size: .78rem;
  padding: .48rem 1.2rem;
  background: linear-gradient(135deg, #f0d080 0%, #d4af58 48%, #c8853a 100%);
  color: #0e0c18;
  font-weight: 700;
  box-shadow: 
    0 0 32px rgba(212,175,88,.42),
    0 4px 20px rgba(0,0,0,.6),
    inset 0 1px 0 rgba(255,255,255,.35);
  border-radius: 10px;
}
.kt-btn--sm:hover {
  transform: translateY(-3px) scale(1.05);
  box-shadow: 
    0 0 48px rgba(212,175,88,.65),
    0 12px 36px rgba(0,0,0,.7),
    inset 0 1px 0 rgba(255,255,255,.4);
}
.kt-btn--lg {
  font-size: clamp(.9rem, 2vw, .98rem);
  padding: clamp(.82rem, 2vw, 1rem) clamp(1.6rem, 3.5vw, 2.4rem);
  border-radius: 12px;
}
.kt-btn--primary {
  background: linear-gradient(135deg, #fff0b0 0%, #f0d080 35%, #d4af58 68%, #c8853a 100%);
  color: #0e0c18;
  font-weight: 700;
  box-shadow:
    0 0 0 1px rgba(212,175,88,.35),
    0 0 60px rgba(212,175,88,.32),
    0 16px 56px rgba(0,0,0,.6),
    inset 0 1px 0 rgba(255,255,255,.32);
}
.kt-btn--primary:hover {
  transform: translateY(-4px) scale(1.03);
  box-shadow:
    0 0 0 1px rgba(212,175,88,.6),
    0 0 100px rgba(212,175,88,.55),
    0 28px 80px rgba(0,0,0,.7),
    inset 0 1px 0 rgba(255,255,255,.38);
}
.kt-btn--primary:active { transform: translateY(-1px) scale(1.01); }
.kt-btn--ghost {
  background: rgba(255,255,255,.04);
  color: var(--muted);
  border: 1.5px solid var(--border2);
  backdrop-filter: blur(12px);
}
.kt-btn--ghost:hover {
  background: linear-gradient(135deg, rgba(212,175,88,.1), rgba(168,120,240,.08));
  color: var(--gold2);
  border-color: rgba(212,175,88,.45);
  transform: translateY(-3px);
  box-shadow: 
    0 0 40px rgba(212,175,88,.18),
    0 0 0 1px rgba(212,175,88,.15);
}
.kt-btn--ghost:active { transform: translateY(0); }

/* ══════════════════════════════════════
   PILL BADGE - LUXURY
══════════════════════════════════════ */
.kt-pill {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: .44rem 1.2rem;
  border-radius: 100px;
  border: 1px solid rgba(212,175,88,.38);
  background: linear-gradient(135deg, rgba(212,175,88,.08), rgba(168,120,240,.05));
  font-size: .72rem;
  color: var(--gold2);
  letter-spacing: .11em;
  text-transform: uppercase;
  margin-bottom: clamp(1.6rem, 3vw, 2.4rem);
  backdrop-filter: blur(20px);
  box-shadow: 
    0 0 32px rgba(212,175,88,.12),
    inset 0 1px 0 rgba(255,255,255,.08);
  font-weight: 600;
}

/* ══════════════════════════════════════
   HERO - DRAMATIC
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
    radial-gradient(ellipse 130% 80% at 50% -15%, rgba(212,175,88,.12) 0%, transparent 50%),
    radial-gradient(ellipse 65% 55% at 5% 85%, rgba(130,60,220,.1) 0%, transparent 50%),
    radial-gradient(ellipse 55% 48% at 95% 80%, rgba(200,133,58,.08) 0%, transparent 50%),
    radial-gradient(ellipse 80% 60% at 50% 100%, rgba(0,212,255,.08) 0%, transparent 50%);
  pointer-events: none;
}
.kt-hero__glow-center {
  position: absolute;
  width: min(900px, 95vw);
  height: min(900px, 95vw);
  border-radius: 50%;
  background: radial-gradient(circle, rgba(212,175,88,.08) 0%, transparent 65%);
  top: 50%; left: 50%;
  transform: translate(-50%, -55%);
  pointer-events: none;
  filter: blur(60px);
  animation: glow-breathe 11s cubic-bezier(.34,1.56,.64,1) infinite;
}
.kt-hero__glow-accent {
  position: absolute;
  width: min(600px, 85vw);
  height: min(600px, 85vw);
  border-radius: 50%;
  background: radial-gradient(circle, rgba(0,212,255,.06) 0%, transparent 65%);
  top: 45%; right: 5%;
  pointer-events: none;
  filter: blur(50px);
  animation: glow-breathe 13s cubic-bezier(.34,1.56,.64,1) infinite reverse;
  animation-delay: -2s;
}
@keyframes glow-breathe {
  0%,100% { opacity: .6; transform: translate(-50%, -55%) scale(1); }
  50%      { opacity: 1; transform: translate(-50%, -55%) scale(1.08); }
}
.kt-hero__arc {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  animation: arc-breathe 10s cubic-bezier(.34,1.56,.64,1) infinite;
}
.kt-hero__arc--1 {
  width: min(680px, 95vw); height: min(680px, 95vw);
  border: 1.5px solid rgba(212,175,88,.09);
}
.kt-hero__arc--2 {
  width: min(1020px, 145vw); height: min(1020px, 145vw);
  border: 1px solid rgba(212,175,88,.04);
  animation-delay: -4s; 
  animation-direction: reverse;
}
.kt-hero__arc--3 {
  width: min(1360px, 190vw); height: min(1360px, 190vw);
  border: 0.5px solid rgba(212,175,88,.02);
  animation-delay: -7.5s;
}
@keyframes arc-breathe {
  0%,100% { opacity: .5; transform: translate(-50%,-50%) scale(1); }
  50%      { opacity: 1; transform: translate(-50%,-50%) scale(1.025); }
}
.kt-hero__inner {
  position: relative;
  z-index: 1;
  max-width: 920px;
  width: 100%;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.kt-hero__h1 {
  font-family: var(--font-display);
  font-size: clamp(2.8rem, 10vw, 6.8rem);
  font-weight: 700;
  line-height: 1.02;
  letter-spacing: -.018em;
  color: #f8f3e8;
  margin-bottom: clamp(1.2rem, 3vw, 2rem);
  text-shadow: 0 0 140px rgba(212,175,88,.15);
}
.kt-hero__sub {
  font-size: clamp(.95rem, 2.2vw, 1.22rem);
  color: rgba(255,255,255,.5);
  line-height: 1.88;
  max-width: 600px;
  margin-bottom: clamp(2.2rem, 4vw, 3.2rem);
  font-weight: 300;
  letter-spacing: .01em;
}
.kt-hero__ctas {
  display: flex;
  gap: clamp(.7rem, 2vw, 1.2rem);
  flex-wrap: wrap;
  justify-content: center;
  margin-bottom: clamp(2.8rem, 5vw, 4.4rem);
}
.kt-hero__wave-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: .8rem;
  margin-bottom: clamp(2.8rem, 5vw, 4.8rem);
  width: 100%;
}
.kt-hero__wave-label {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: .69rem;
  letter-spacing: .16em;
  text-transform: uppercase;
  color: rgba(212,175,88,.52);
  font-family: var(--font-display);
  font-weight: 600;
}
.kt-hero__wave-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--gold);
  box-shadow: 0 0 12px var(--gold), 0 0 2px var(--gold3);
  animation: dot-blink 1.6s cubic-bezier(.34,1.56,.64,1) infinite;
}
@keyframes dot-blink {
  0%,100% { opacity: .3; }
  50%      { opacity: 1; }
}
.kt-hero__scroll-cue {
  position: absolute;
  bottom: clamp(1.4rem, 3vw, 2.2rem);
  left: 50%;
  transform: translateX(-50%);
  color: rgba(212,175,88,.45);
  animation: scroll-bob 2.6s cubic-bezier(.34,1.56,.64,1) infinite;
  text-decoration: none;
  transition: all .4s cubic-bezier(.34,1.56,.64,1);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 42px; height: 42px;
  border-radius: 50%;
  border: 1.5px solid rgba(212,175,88,.22);
  box-shadow: 0 0 20px rgba(212,175,88,.08);
}
.kt-hero__scroll-cue:hover {
  color: var(--gold2);
  border-color: rgba(212,175,88,.48);
  box-shadow: 0 0 32px rgba(212,175,88,.16);
  transform: translateX(-50%) scale(1.1);
}
@keyframes scroll-bob {
  0%,100% { transform: translateX(-50%) translateY(0); opacity: .5; }
  50%      { transform: translateX(-50%) translateY(8px); opacity: 1; }
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
  font-size: clamp(.8rem, 1.3vw, 1.5rem);
  color: rgba(212,175,88,.13);
  animation: rune-float 26s cubic-bezier(.34,1.56,.64,1) infinite;
  animation-delay: calc(var(--ri) * -2s);
  user-select: none;
  text-shadow: 0 0 20px rgba(212,175,88,.1);
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
  0%,100% { transform: translateY(0) rotate(0deg); opacity: .13; }
  25%      { transform: translateY(-22px) rotate(8deg); opacity: .28; }
  50%      { transform: translateY(-10px) rotate(-6deg); opacity: .08; }
  75%      { transform: translateY(-26px) rotate(10deg); opacity: .22; }
}

/* ── Waveform ── */
.wavebars {
  display: flex;
  align-items: center;
  gap: clamp(2.5px, .6vw, 4px);
  height: 64px;
  max-width: 100%;
  overflow: hidden;
}
.wavebar {
  flex-shrink: 0;
  width: clamp(2.5px, .5vw, 3.5px);
  border-radius: 6px;
  background: linear-gradient(180deg, 
    #fff0b0 0%, 
    #f0d080 30%,
    #d4af58 60%,
    #c8853a 100%);
  animation: wave 1.7s cubic-bezier(.34,1.56,.64,1) infinite;
  animation-delay: calc(var(--i) * 32ms);
  box-shadow: 
    0 0 12px rgba(212,175,88,.28),
    0 0 32px rgba(212,175,88,.1);
}
@keyframes wave {
  0%,100% { height: 4px;  opacity: .2; }
  50%      { height: 52px; opacity: 1; }
}

/* ── Stats ── */
.kt-hero__stats {
  display: flex;
  gap: clamp(1.8rem, 5vw, 4rem);
  flex-wrap: wrap;
  justify-content: center;
  padding: clamp(1.4rem, 3vw, 2.2rem) clamp(1.8rem, 4vw, 3.6rem);
  border: 1px solid rgba(212,175,88,.16);
  border-radius: 24px;
  background: linear-gradient(135deg, 
    rgba(212,175,88,.08),
    rgba(168,120,240,.04));
  backdrop-filter: blur(20px) saturate(180%);
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.08),
    0 0 80px rgba(0,0,0,.5),
    0 0 0 1px rgba(0,0,0,.3);
  width: 100%;
  max-width: 760px;
}
.kt-stat { text-align: center; flex: 1; min-width: 90px; }
.kt-stat__value {
  display: block;
  font-family: var(--font-display);
  font-size: clamp(1.8rem, 5vw, 2.6rem);
  font-weight: 700;
  letter-spacing: -.025em;
  background: linear-gradient(135deg, #fff0b0 0%, #f0d080 35%, #d4af58 70%, #c8853a 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  filter: drop-shadow(0 0 24px rgba(212,175,88,.48));
}
.kt-stat__label {
  display: block;
  font-size: clamp(.64rem, 1.4vw, .74rem);
  color: rgba(255,255,255,.42);
  margin-top: 6px;
  letter-spacing: .14em;
  text-transform: uppercase;
  font-weight: 500;
}
.kt-stat + .kt-stat {
  border-left: 1px solid rgba(212,175,88,.14);
  padding-left: clamp(1.8rem, 5vw, 4rem);
}

/* ══════════════════════════════════════
   SECTION SHARED
══════════════════════════════════════ */
.kt-section-head {
  text-align: center;
  margin-bottom: clamp(3.4rem, 8vw, 5.8rem);
}
.kt-eyebrow {
  font-size: .68rem;
  letter-spacing: .24em;
  text-transform: uppercase;
  color: var(--gold);
  margin-bottom: 1rem;
  font-family: var(--font-display);
  font-weight: 700;
}
.kt-h2 {
  font-family: var(--font-display);
  font-size: clamp(2.1rem, 6vw, 3.8rem);
  font-weight: 700;
  line-height: 1.06;
  letter-spacing: -.013em;
  color: #f8f3e8;
  margin-bottom: 1.4rem;
  text-shadow: 0 0 100px rgba(212,175,88,.12);
}
.kt-section-sub {
  font-size: clamp(.95rem, 2vw, 1.1rem);
  color: rgba(255,255,255,.48);
  line-height: 1.85;
  max-width: 580px;
  margin: 0 auto;
  font-weight: 300;
  letter-spacing: .01em;
}

/* ══════════════════════════════════════
   FEATURES - LUXURY CARDS
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
    radial-gradient(ellipse 65% 45% at 50% 0%, rgba(212,175,88,.05) 0%, transparent 55%),
    radial-gradient(ellipse 60% 45% at 50% 100%, rgba(120,60,220,.05) 0%, transparent 55%);
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
  gap: clamp(1.2rem, 2.5vw, 1.8rem);
}

/* ── Feature card ── */
.kt-card {
  position: relative;
  padding: clamp(2rem, 3.5vw, 2.8rem) clamp(1.6rem, 3vw, 2.4rem);
  border-radius: var(--radius-card);
  border: 1px solid var(--border);
  background: linear-gradient(148deg,
    rgba(18,14,38,.96) 0%,
    rgba(6,4,14,.98) 100%);
  overflow: hidden;
  transition: all .48s cubic-bezier(.34,1.56,.64,1);
  isolation: isolate;
  cursor: pointer;
}
.kt-card__bg {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse 85% 65% at 50% 0%, rgba(212,175,88,.04) 0%, transparent 60%);
  opacity: 0;
  transition: opacity .5s cubic-bezier(.34,1.56,.64,1);
}
.kt-card:hover .kt-card__bg { opacity: 1; }
.kt-card__glow {
  position: absolute;
  width: 300px; height: 300px;
  border-radius: 50%;
  background: radial-gradient(circle, color-mix(in srgb, var(--card-accent) 22%, transparent) 0%, transparent 65%);
  top: -120px; left: -120px;
  pointer-events: none;
  opacity: 0;
  transition: opacity .5s, transform .5s cubic-bezier(.34,1.56,.64,1);
  transform: scale(.6);
  filter: blur(20px);
}
.kt-card:hover .kt-card__glow { opacity: 1; transform: scale(1.1); }
.kt-card__corner {
  position: absolute;
  width: 18px; height: 18px;
  pointer-events: none;
  opacity: 0;
  transition: opacity .45s;
  border-color: var(--card-accent, var(--gold));
}
.kt-card__corner--tl {
  top: 12px; left: 12px;
  border-top: 1.5px solid;
  border-left: 1.5px solid;
  border-radius: 2px 0 0 0;
}
.kt-card__corner--br {
  bottom: 12px; right: 12px;
  border-bottom: 1.5px solid;
  border-right: 1.5px solid;
  border-radius: 0 0 2px 0;
}
.kt-card:hover .kt-card__corner { opacity: 1; }
.kt-card__bottom-line {
  position: absolute;
  bottom: 0; left: 15%; right: 15%;
  height: 1.5px;
  background: linear-gradient(90deg, transparent, var(--card-accent, var(--gold)), transparent);
  opacity: 0;
  transition: opacity .5s;
}
.kt-card:hover .kt-card__bottom-line { opacity: .4; }
.kt-card:hover {
  transform: translateY(-12px);
  border-color: rgba(212,175,88,.35);
  box-shadow:
    0 0 0 1px rgba(212,175,88,.1),
    0 40px 120px rgba(0,0,0,.8),
    0 0 100px rgba(212,175,88,.065),
    inset 0 1px 0 rgba(212,175,88,.08);
}
.kt-card__icon {
  width: 56px; height: 56px;
  border-radius: 16px;
  background: linear-gradient(135deg,
    color-mix(in srgb, var(--card-accent) 24%, transparent) 0%,
    color-mix(in srgb, var(--card-accent) 8%, transparent) 100%);
  border: 1.5px solid color-mix(in srgb, var(--card-accent) 32%, transparent);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--card-accent, var(--gold2));
  margin-bottom: clamp(1.3rem, 2.5vw, 1.8rem);
  transition: all .4s cubic-bezier(.34,1.56,.64,1);
  box-shadow: 0 0 28px color-mix(in srgb, var(--card-accent) 12%, transparent);
}
.kt-card:hover .kt-card__icon {
  border-color: color-mix(in srgb, var(--card-accent) 55%, transparent);
  box-shadow: 0 0 48px color-mix(in srgb, var(--card-accent) 28%, transparent);
  transform: scale(1.12) rotate(5deg);
}
.kt-card__title {
  font-family: var(--font-display);
  font-size: clamp(.86rem, 1.6vw, .98rem);
  font-weight: 700;
  color: #f5edd8;
  margin-bottom: .8rem;
  letter-spacing: .05em;
}
.kt-card__desc {
  font-size: clamp(.85rem, 1.5vw, .92rem);
  color: rgba(255,255,255,.48);
  line-height: 1.82;
  font-weight: 300;
}

/* ══════════════════════════════════════
   HOW IT WORKS - REFINED
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
  background: linear-gradient(90deg, transparent 0%, rgba(212,175,88,.22) 35%, rgba(212,175,88,.22) 65%, transparent 100%);
}
.kt-how__inner {
  position: relative;
  z-index: 1;
  max-width: 820px;
  margin: 0 auto;
}
.kt-steps {
  display: flex;
  flex-direction: column;
  gap: 0;
}
.kt-step {
  display: grid;
  grid-template-columns: 90px 1fr;
  gap: clamp(1.4rem, 3.5vw, 2.4rem);
  padding: clamp(2rem, 3.5vw, 2.8rem) clamp(1.4rem, 3vw, 2.8rem);
  border-radius: 20px;
  border: 1px solid transparent;
  transition: all .4s cubic-bezier(.34,1.56,.64,1);
  position: relative;
  align-items: flex-start;
}
.kt-step:hover {
  border-color: rgba(212,175,88,.22);
  background: linear-gradient(135deg, rgba(212,175,88,.04), rgba(168,120,240,.02));
  box-shadow: 0 0 40px rgba(212,175,88,.08);
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
  font-size: clamp(2.2rem, 5vw, 3rem);
  font-weight: 700;
  letter-spacing: -.04em;
  line-height: 1;
  background: linear-gradient(135deg, #fff0b0 0%, #f0d080 40%, #d4af58 75%, #c8853a 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  filter: drop-shadow(0 0 20px rgba(212,175,88,.4));
  flex-shrink: 0;
}
.kt-step__line {
  width: 1px;
  flex: 1;
  min-height: 48px;
  background: linear-gradient(to bottom, rgba(212,175,88,.28), rgba(212,175,88,.05));
  margin-top: 12px;
  align-self: stretch;
}
.kt-step__body {
  flex: 1;
  padding-top: .2rem;
}
.kt-step__glyph {
  font-size: 1.4rem;
  color: rgba(212,175,88,.24);
  margin-bottom: .6rem;
  line-height: 1;
  transition: all .4s cubic-bezier(.34,1.56,.64,1);
}
.kt-step:hover .kt-step__glyph { color: rgba(212,175,88,.5); transform: scale(1.15); }
.kt-step__title {
  font-family: var(--font-display);
  font-size: clamp(.98rem, 2vw, 1.14rem);
  font-weight: 700;
  color: #f5edd8;
  margin-bottom: .7rem;
  letter-spacing: .035em;
}
.kt-step__desc {
  font-size: clamp(.88rem, 1.6vw, .96rem);
  color: rgba(255,255,255,.48);
  line-height: 1.82;
  font-weight: 300;
}

/* ══════════════════════════════════════
   CTA - PREMIUM
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
    radial-gradient(ellipse 85% 65% at 50% 50%, rgba(212,175,88,.08) 0%, transparent 55%),
    radial-gradient(ellipse 55% 45% at 20% 65%, rgba(140,60,220,.06) 0%, transparent 50%),
    radial-gradient(ellipse 55% 45% at 80% 35%, rgba(200,133,58,.05) 0%, transparent 50%),
    radial-gradient(ellipse 70% 50% at 50% 100%, rgba(0,212,255,.04) 0%, transparent 50%);
  pointer-events: none;
  animation: aurora-shift 18s cubic-bezier(.34,1.56,.64,1) infinite;
}
@keyframes aurora-shift {
  0%,100% { opacity: .6; transform: scale(1); }
  50%      { opacity: 1; transform: scale(1.05); }
}
.kt-cta__ring {
  position: absolute;
  top: 50%; left: 50%;
  border-radius: 50%;
  border: 1px solid rgba(212,175,88,.08);
  transform: translate(-50%,-50%);
  pointer-events: none;
  animation: ring-pulse 8s cubic-bezier(.34,1.56,.64,1) infinite;
}
.kt-cta__ring--1 { width: min(450px, 85vw); height: min(450px, 85vw); animation-delay: 0s; }
.kt-cta__ring--2 { width: min(750px, 135vw); height: min(750px, 135vw); animation-delay: -2.7s; }
.kt-cta__ring--3 { width: min(1050px, 190vw); height: min(1050px, 190vw); animation-delay: -5.4s; }
@keyframes ring-pulse {
  0%,100% { opacity: .3; transform: translate(-50%,-50%) scale(1); }
  50%      { opacity: .9; transform: translate(-50%,-50%) scale(1.04); }
}
.kt-cta__inner {
  position: relative;
  z-index: 1;
  max-width: 750px;
  margin: 0 auto;
}
.kt-cta .kt-section-sub { margin-bottom: 0; }
.kt-cta__btns {
  display: flex;
  gap: clamp(.7rem, 2vw, 1.2rem);
  justify-content: center;
  flex-wrap: wrap;
  margin: clamp(2.2rem, 5vw, 3.4rem) 0 0;
}

/* ══════════════════════════════════════
   FOOTER - REFINED
══════════════════════════════════════ */
.kt-footer {
  position: relative;
  padding: clamp(2.4rem, 5vw, 3.6rem) clamp(1rem, 5vw, 2rem);
}
.kt-footer__line {
  position: absolute;
  top: 0; left: 8%; right: 8%;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(212,175,88,.28), transparent);
}
.kt-footer__inner {
  max-width: var(--max-w);
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 2rem;
}
.kt-footer__links { display: flex; gap: clamp(1.2rem, 4vw, 2.4rem); flex-wrap: wrap; }
.kt-footer__copy {
  font-size: .77rem;
  color: rgba(255,255,255,.35);
  letter-spacing: .03em;
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
    grid-template-columns: 75px 1fr;
  }
}

/* ── Tablet portrait (≤768px) ── */
@media (max-width: 768px) {
  .kt-hero__h1 { font-size: clamp(2.4rem, 11vw, 3.8rem); }

  .kt-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }

  .kt-hero__stats {
    gap: 1.3rem;
    padding: 1.4rem 1.6rem;
  }
  .kt-stat + .kt-stat {
    border-left: 1px solid var(--border);
    padding-left: 1.3rem;
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
    gap: 1rem;
  }

  .kt-hero__h1 { font-size: clamp(2.1rem, 12vw, 3rem); }

  .kt-hero__stats {
    flex-direction: column;
    align-items: center;
    gap: 1.3rem;
    padding: 1.6rem 1.8rem;
  }
  .kt-stat + .kt-stat {
    border-left: none;
    padding-left: 0;
    border-top: 1px solid var(--border);
    padding-top: 1.3rem;
    width: 100%;
  }
  .kt-stat { width: 100%; }

  .kt-hero__ctas { flex-direction: column; align-items: center; width: 100%; }
  .kt-btn--lg { width: 100%; justify-content: center; }

  .kt-step {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  .kt-step__track {
    flex-direction: row;
    align-items: center;
  }
  .kt-step__line {
    width: 48px;
    height: 1px;
    min-height: unset;
    background: linear-gradient(to right, rgba(212,175,88,.28), rgba(212,175,88,.05));
    margin-top: 0;
    margin-left: 12px;
  }

  .kt-footer__inner { align-items: center; text-align: center; }
  .kt-footer__links { justify-content: center; flex-wrap: wrap; gap: 1rem; }

  .kt-br { display: none; }
  .wavebar:nth-child(n+42) { display: none; }
  .rune { display: none; }

  .kt-cta__btns { flex-direction: column; align-items: center; width: 100%; }

  .kt-hero__wave-wrap { overflow: hidden; }
}

/* ── Tiny mobile (≤380px) ── */
@media (max-width: 380px) {
  .kt-hero__h1 { font-size: 2rem; }
  .kt-hero__sub { font-size: .92rem; }
  .wavebar:nth-child(n+30) { display: none; }
}

/* ══════════════════════════════════════
   PRICING SECTION
══════════════════════════════════════ */
.kt-pricing {
  position: relative;
  padding: var(--space-2xl) 0;
  overflow: hidden;
}
.kt-pricing__sweep {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 80% 60% at 50% 0%, rgba(168,120,240,.06) 0%, transparent 70%),
    radial-gradient(ellipse 60% 40% at 50% 100%, rgba(212,175,88,.05) 0%, transparent 70%);
  pointer-events: none;
}
.kt-pricing__inner {
  max-width: var(--max-w);
  margin: 0 auto;
  padding: 0 var(--space-md);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-xl);
}
.kt-pricing__grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
  width: 100%;
  max-width: 1080px;
  align-items: start;
}
.kt-pricing__note {
  font-size: .88rem;
  color: var(--muted);
  text-align: center;
  opacity: 0;
  transform: translateY(24px);
  transition: opacity .8s cubic-bezier(.16,1,.3,1), transform .8s cubic-bezier(.16,1,.3,1);
}
.kt-pricing__note.revealed {
  opacity: 1;
  transform: none;
}

/* ── Pricing card ── */
.kt-price-card {
  position: relative;
  border-radius: var(--radius-card);
  border: 1px solid var(--border);
  padding: 2rem 1.75rem 1.75rem;
  display: flex;
  flex-direction: column;
  gap: 1.4rem;
  background: rgba(17,15,40,.55);
  backdrop-filter: blur(18px);
  overflow: hidden;
  transition: border-color .35s, transform .35s cubic-bezier(.16,1,.3,1), box-shadow .35s;
}
.kt-price-card::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(135deg, rgba(255,255,255,.025) 0%, transparent 60%);
  pointer-events: none;
}
.kt-price-card:hover {
  border-color: color-mix(in srgb, var(--price-accent) 60%, transparent);
  transform: translateY(-6px);
  box-shadow: 0 24px 60px rgba(0,0,0,.35), 0 0 0 1px color-mix(in srgb, var(--price-accent) 20%, transparent);
}
.kt-price-card--popular {
  border-color: rgba(168,120,240,.45);
  background: rgba(20,16,48,.72);
  box-shadow:
    0 0 0 1px rgba(168,120,240,.18),
    0 8px 48px rgba(168,120,240,.12),
    inset 0 1px 0 rgba(255,255,255,.06);
  transform: scale(1.035);
}
.kt-price-card--popular:hover {
  transform: scale(1.035) translateY(-6px);
  box-shadow:
    0 0 0 1px rgba(168,120,240,.38),
    0 28px 72px rgba(168,120,240,.2),
    inset 0 1px 0 rgba(255,255,255,.08);
}
.kt-price-card__bg {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 50% 0%, color-mix(in srgb, var(--price-accent) 8%, transparent) 0%, transparent 60%);
  pointer-events: none;
  transition: opacity .35s;
  opacity: 0;
}
.kt-price-card:hover .kt-price-card__bg { opacity: 1; }
.kt-price-card--popular .kt-price-card__bg { opacity: .7; }
.kt-price-card__glow {
  position: absolute;
  top: -60px; left: 50%;
  transform: translateX(-50%);
  width: 200px; height: 200px;
  border-radius: 50%;
  background: radial-gradient(circle, color-mix(in srgb, var(--price-accent) 18%, transparent) 0%, transparent 70%);
  filter: blur(40px);
  pointer-events: none;
  opacity: 0;
  transition: opacity .5s;
}
.kt-price-card:hover .kt-price-card__glow,
.kt-price-card--popular .kt-price-card__glow { opacity: 1; }

.kt-price-card__badge {
  position: absolute;
  top: -1px; right: 1.75rem;
  padding: .28rem .9rem;
  font-size: .72rem;
  font-weight: 700;
  letter-spacing: .08em;
  text-transform: uppercase;
  background: linear-gradient(135deg, var(--purple) 0%, #7740e8 100%);
  color: #fff;
  border-radius: 0 0 10px 10px;
  box-shadow: 0 4px 16px rgba(168,120,240,.4);
}

.kt-price-card__header {
  display: flex;
  flex-direction: column;
  gap: .4rem;
}
.kt-price-card__name {
  font-family: var(--font-display);
  font-size: 1.15rem;
  font-weight: 600;
  letter-spacing: .02em;
  color: #ede8f5;
}
.kt-price-card__desc {
  font-size: .85rem;
  color: var(--muted);
  line-height: 1.5;
}

.kt-price-card__price-row {
  display: flex;
  align-items: baseline;
  gap: .15rem;
  padding-bottom: 1.2rem;
  border-bottom: 1px solid var(--border);
}
.kt-price-card__currency {
  font-size: 1.3rem;
  font-weight: 600;
  color: var(--gold2);
  align-self: flex-start;
  margin-top: .5rem;
}
.kt-price-card__amount {
  font-family: var(--font-display);
  font-size: 3.5rem;
  font-weight: 700;
  line-height: 1;
  background: linear-gradient(135deg, var(--gold2) 0%, var(--gold3) 50%, var(--gold) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.kt-price-card__per {
  font-size: .95rem;
  color: var(--muted);
  margin-left: .2rem;
}

.kt-price-card__features {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: .65rem;
  flex: 1;
}
.kt-price-card__feature {
  display: flex;
  align-items: flex-start;
  gap: .55rem;
  font-size: .875rem;
  color: rgba(237,232,245,.82);
  line-height: 1.45;
}
.kt-price-card__check {
  flex-shrink: 0;
  width: 18px; height: 18px;
  border-radius: 50%;
  background: linear-gradient(135deg, color-mix(in srgb, var(--price-accent) 30%, transparent), color-mix(in srgb, var(--price-accent) 10%, transparent));
  border: 1px solid color-mix(in srgb, var(--price-accent) 40%, transparent);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: .6rem;
  font-weight: 700;
  color: var(--gold2);
  margin-top: 2px;
}

.kt-price-card__cta {
  margin-top: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: .5rem;
  padding: .75rem 1.25rem;
  border-radius: 12px;
  font-size: .9rem;
  font-weight: 600;
  letter-spacing: .015em;
  text-decoration: none;
  transition: all .3s cubic-bezier(.16,1,.3,1);
  position: relative;
  overflow: hidden;
}

/* ── Responsive pricing ── */
@media (max-width: 900px) {
  .kt-pricing__grid {
    grid-template-columns: 1fr;
    max-width: 420px;
  }
  .kt-price-card--popular {
    transform: none;
  }
  .kt-price-card--popular:hover {
    transform: translateY(-6px);
  }
}
@media (max-width: 540px) {
  .kt-pricing__grid {
    max-width: 100%;
  }
}

/* ── Reduced motion ── */
@media (prefers-reduced-motion: reduce) {
  [data-reveal] { opacity: 1; transform: none; transition: none; }
  .wavebar, .nebula__blob, .kt-cta__ring, .rune, .kt-cta__aurora,
  .kt-logo__halo, .kt-hero__scroll-cue, .kt-hero__glow-center,
  .kt-hero__arc, .kt-hero__wave-dot, .kt-gradient-text,
  .kt-hero__glow-accent { animation: none !important; }
  .cursor-outer, .cursor-inner { display: none; }
  .kt-btn { transition: background .15s, color .15s; }
  .kt-card { transition: border-color .15s; }
}
`;
// ai-native code editor. That is what i am talkin about
