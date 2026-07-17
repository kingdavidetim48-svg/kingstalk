"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import {
  AnimatePresence,
  motion,
  useMotionTemplate,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import {
  ArrowRight,
  Sparkles,
  Zap,
  Crown,
  Volume2,
  Mic,
  Globe,
  Shield,
  RefreshCw,
  AudioLines,
  Check,
  Play,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const FEATURES = [
  {
    icon: AudioLines,
    title: "Crystal-Clear Audio",
    body: "48 kHz studio-quality output with zero artifacts. Every word sounds natural, expressive, and professional.",
  },
  {
    icon: Mic,
    title: "20+ Curated Voices",
    body: "Handpicked synthetic voices from warm narrators to crisp announcers. Each trained for maximum expressiveness.",
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    body: "15ms average latency. Generate speech in real-time as you type — optimized inference at scale.",
  },
  {
    icon: Globe,
    title: "Truly Global",
    body: "40+ languages with native accent support. Break language barriers and reach every market.",
  },
  {
    icon: Shield,
    title: "Bank-Grade Security",
    body: "AES-256 encryption at rest and in transit. Your content is yours — we never use it for training.",
  },
  {
    icon: RefreshCw,
    title: "Infinite Scale",
    body: "From single videos to millions of hours. Auto-scaling infrastructure with predictable pricing.",
  },
];

const STEPS = [
  {
    numeral: "I",
    icon: Sparkles,
    title: "Paste your text",
    body: "Scripts, articles, emails, or raw ideas. Paste anything and start playing.",
  },
  {
    numeral: "II",
    icon: Volume2,
    title: "Pick your voice",
    body: "Choose from 20+ expressive voices. Preview instantly. Adjust pitch, speed, and emphasis.",
  },
  {
    numeral: "III",
    icon: ArrowRight,
    title: "Export to anywhere",
    body: "Download MP3, WAV, or stream directly to your app. Works everywhere in seconds.",
  },
];

const TIERS = [
  {
    name: "Starter",
    price: "$9",
    tagline: "Perfect for individual creators getting started.",
    features: [
      "100,000 characters/month",
      "3,000 characters per generation",
      "1 custom voice clone",
      "Standard voice library",
      "MP3 & WAV export",
      "Email support",
    ],
    cta: "Start with Starter",
    featured: false,
  },
  {
    name: "Creator",
    price: "$19",
    tagline: "For content creators who need more power and voices.",
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
    featured: true,
  },
  {
    name: "Pro",
    price: "$49",
    tagline: "For agencies and teams demanding unlimited scale.",
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
    featured: false,
  },
];

const EASE = [0.21, 0.47, 0.32, 0.98] as const;

/* ---------------------------------------------------------------------- */
/* Ambient / cursor layer                                                  */
/* ---------------------------------------------------------------------- */

function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  return (
    <motion.div
      style={{ scaleX: scrollYProgress }}
      className="fixed inset-x-0 top-0 z-[80] h-[2px] origin-left bg-gradient-to-r from-[#8A6A1E] via-[#E8D9B5] to-[#C9A227]"
    />
  );
}

function CursorGlow() {
  const mx = useMotionValue(-400);
  const my = useMotionValue(-400);

  useEffect(() => {
    const move = (e: MouseEvent) => {
      mx.set(e.clientX);
      my.set(e.clientY);
    };
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, [mx, my]);

  const background = useMotionTemplate`radial-gradient(650px circle at ${mx}px ${my}px, rgba(201,162,39,0.10), transparent 42%)`;

  return (
    <motion.div
      style={{ background }}
      className="pointer-events-none fixed inset-0 z-10 hidden lg:block"
      aria-hidden
    />
  );
}

function CursorRing() {
  const mx = useMotionValue(-400);
  const my = useMotionValue(-400);
  const sx = useSpring(mx, { stiffness: 260, damping: 22, mass: 0.4 });
  const sy = useSpring(my, { stiffness: 260, damping: 22, mass: 0.4 });

  useEffect(() => {
    const move = (e: MouseEvent) => {
      mx.set(e.clientX);
      my.set(e.clientY);
    };
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, [mx, my]);

  return (
    <motion.div
      style={{ x: sx, y: sy }}
      className="pointer-events-none fixed left-0 top-0 z-[65] hidden h-7 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#D9BE6C]/60 lg:block"
      aria-hidden
    />
  );
}

function FloatingOrbs() {
  const { scrollYProgress } = useScroll();
  const y1 = useTransform(scrollYProgress, [0, 1], [0, -220]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, 260]);
  const y3 = useTransform(scrollYProgress, [0, 1], [0, -140]);
  const rotate = useTransform(scrollYProgress, [0, 1], [0, 25]);

  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      aria-hidden
    >
      <motion.div
        style={{ y: y1 }}
        className="absolute -top-10 left-[6%] h-[18rem] w-[18rem] animate-drift-slow rounded-full bg-[#C9A227]/[0.06] blur-[90px] sm:h-[26rem] sm:w-[26rem] sm:blur-[120px]"
      />
      <motion.div
        style={{ y: y2 }}
        className="absolute top-[45%] right-[-10%] h-[20rem] w-[20rem] animate-drift-slower rounded-full bg-[#5C1A24]/[0.12] blur-[100px] sm:h-[30rem] sm:w-[30rem] sm:blur-[130px]"
      />
      <motion.div
        style={{ y: y3, rotate }}
        className="absolute bottom-[-8%] left-[20%] h-[16rem] w-[16rem] animate-drift-slow rounded-full bg-[#C9A227]/[0.05] blur-[90px] sm:h-[22rem] sm:w-[22rem] sm:blur-[110px]"
      />
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* Motion helpers                                                          */
/* ---------------------------------------------------------------------- */

function Reveal({
  children,
  delay = 0,
  className,
  y = 24,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  y?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.7, delay, ease: EASE }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function Magnetic({
  children,
  strength = 16,
}: {
  children: React.ReactNode;
  strength?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  return (
    <motion.div
      ref={ref}
      onMouseMove={(e) => {
        const rect = ref.current?.getBoundingClientRect();
        if (!rect) return;
        setPos({
          x: (e.clientX - rect.left - rect.width / 2) / strength,
          y: (e.clientY - rect.top - rect.height / 2) / strength,
        });
      }}
      onMouseLeave={() => setPos({ x: 0, y: 0 })}
      animate={{ x: pos.x, y: pos.y }}
      transition={{ type: "spring", stiffness: 180, damping: 14, mass: 0.15 }}
      className="inline-block"
    >
      {children}
    </motion.div>
  );
}

/**
 * Weightless card: tilts gently toward the cursor in 3D and carries a
 * cursor-tracked spotlight — the "floating panel" signature of this design.
 */
function FloatingCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [spot, setSpot] = useState({ x: 50, y: 50 });
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const srx = useSpring(rx, { stiffness: 200, damping: 20, mass: 0.5 });
  const sry = useSpring(ry, { stiffness: 200, damping: 20, mass: 0.5 });

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    ry.set((px - 0.5) * 10);
    rx.set((0.5 - py) * 10);
    setSpot({ x: px * 100, y: py * 100 });
  };

  const reset = () => {
    rx.set(0);
    ry.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={reset}
      style={{ rotateX: srx, rotateY: sry, transformPerspective: 1000 }}
      className={`group relative overflow-hidden will-change-transform ${className ?? ""}`}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background: `radial-gradient(360px circle at ${spot.x}% ${spot.y}%, rgba(201,162,39,0.16), transparent 62%)`,
        }}
      />
      <div className="relative" style={{ transform: "translateZ(24px)" }}>
        {children}
      </div>
    </motion.div>
  );
}

/* ---------------------------------------------------------------------- */
/* Small display bits                                                      */
/* ---------------------------------------------------------------------- */

function Seal({
  children,
  size = "md",
}: {
  children: React.ReactNode;
  size?: "sm" | "md";
}) {
  const dims = size === "sm" ? "size-11" : "size-14";
  return (
    <div
      className={`relative ${dims} shrink-0 transition-transform duration-500 group-hover:rotate-[25deg]`}
    >
      <div className="absolute inset-0 rounded-full border border-[#C9A227]/40" />
      <div className="absolute inset-[3px] rounded-full border border-[#C9A227]/25" />
      <div className="absolute inset-[3px] rounded-full bg-gradient-to-b from-[#C9A227]/10 to-transparent" />
      <div className="absolute inset-0 rounded-full opacity-0 shadow-[0_0_20px_4px_rgba(201,162,39,0.35)] transition-opacity duration-500 group-hover:opacity-100" />
      <div className="relative flex h-full w-full items-center justify-center text-[#D9BE6C]">
        {children}
      </div>
    </div>
  );
}

function ReignRule() {
  return (
    <div className="mx-auto mb-14 flex w-full max-w-xs items-center gap-3 sm:mb-20">
      <span className="h-px flex-1 bg-gradient-to-r from-transparent to-[#C9A227]/50" />
      <span className="size-1.5 rotate-45 bg-[#C9A227]/70" />
      <span className="h-px flex-1 bg-gradient-to-l from-transparent to-[#C9A227]/50" />
    </div>
  );
}

const NAV_LINKS = [
  { href: "#features", label: "Features" },
  { href: "#how", label: "How it works" },
  { href: "#pricing", label: "Pricing" },
];

const whiteButtonClasses =
  "rounded-full border border-white/10 bg-white font-semibold text-[#0A0908] shadow-[0_2px_12px_rgba(0,0,0,0.25)] transition-all duration-200 hover:bg-[#F3EDE0]";

/* ---------------------------------------------------------------------- */
/* Main component                                                          */
/* ---------------------------------------------------------------------- */

export function KingsTalkLanding({ isSignedIn }: { isSignedIn: boolean }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#050403] font-[Manrope,sans-serif] text-[#E9E2D3] selection:bg-[#C9A227]/30">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Manrope:wght@400;500;600;700;800&display=swap');
        .font-display { font-family: 'Cormorant Garamond', serif; }

        @keyframes drift-slow {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(30px, -20px) scale(1.08); }
        }
        @keyframes drift-slower {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-40px, 25px) scale(1.05); }
        }
        .animate-drift-slow { animation: drift-slow 14s ease-in-out infinite; }
        .animate-drift-slower { animation: drift-slower 18s ease-in-out infinite; }

        @keyframes shimmer {
          to { background-position: 200% center; }
        }
        .shimmer-text {
          background-size: 220% auto;
          animation: shimmer 5s linear infinite;
        }

        @keyframes glow-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(201,162,39,0.35), 0 8px 24px rgba(201,162,39,0.18); }
          50% { box-shadow: 0 0 0 8px rgba(201,162,39,0), 0 8px 30px rgba(201,162,39,0.3); }
        }
        .glow-pulse { animation: glow-pulse 3.2s ease-in-out infinite; }

        @keyframes eq {
          0%, 100% { transform: scaleY(0.35); }
          50% { transform: scaleY(1); }
        }
        .eq-bar { animation: eq 1.4s ease-in-out infinite; transform-origin: bottom; }

        @keyframes grain {
          0%, 100% { transform: translate(0, 0); }
          10% { transform: translate(-2%, -4%); }
          20% { transform: translate(-6%, 2%); }
          30% { transform: translate(4%, -8%); }
          40% { transform: translate(-4%, 6%); }
          50% { transform: translate(-8%, 2%); }
          60% { transform: translate(6%, 4%); }
          70% { transform: translate(2%, -6%); }
          80% { transform: translate(-2%, 8%); }
          90% { transform: translate(4%, 2%); }
        }
        .grain-layer {
          background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>");
          background-size: 200px 200px;
          animation: grain 1.1s steps(4) infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .animate-drift-slow, .animate-drift-slower, .grain-layer, .shimmer-text, .glow-pulse, .eq-bar { animation: none !important; }
        }
      `}</style>

      {/* Grain overlay */}
      <div
        className="grain-layer pointer-events-none fixed inset-0 z-[55] opacity-[0.035] mix-blend-overlay"
        aria-hidden
      />

      {/* Cursor + ambient layers */}
      <ScrollProgress />
      <CursorGlow />
      <CursorRing />
      <FloatingOrbs />

      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(201,162,39,0.07),transparent)]" />
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_110%,rgba(92,26,36,0.12),transparent)]" />

      {/* Floating glass nav */}
      <header className="fixed inset-x-0 top-0 z-50 flex justify-center px-3 pt-3 sm:px-6 sm:pt-4">
        <div className="w-full max-w-5xl rounded-2xl border border-[#C9A227]/20 bg-[#0D0A07]/80 shadow-[0_8px_32px_rgba(0,0,0,0.45),inset_0_1px_0_0_rgba(255,255,255,0.04)] backdrop-blur-xl sm:rounded-full">
          <div className="flex items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
            <div className="flex items-center gap-2.5">
              <div className="relative flex size-8 shrink-0 items-center justify-center rounded-full border border-[#C9A227]/50 bg-[#0D0A07] text-[#D9BE6C] sm:size-9">
                <Crown className="size-3.5 sm:size-4" strokeWidth={1.75} />
              </div>
              <span className="font-display text-xl font-semibold tracking-wide text-[#F3EDE0] sm:text-2xl">
                Kings<span className="text-[#C9A227]">Talk</span>
              </span>
            </div>

            <nav className="hidden md:flex items-center gap-8 text-[13px] font-medium uppercase tracking-[0.12em] text-[#9C9184]">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="transition-colors duration-200 hover:text-[#D9BE6C]"
                >
                  {link.label}
                </a>
              ))}
            </nav>

            <div className="flex items-center gap-2 sm:gap-3">
              {isSignedIn ? (
                <div className="hidden items-center sm:flex">
                  <Magnetic strength={22}>
                    <Link href="/app">
                      <Button
                        size="sm"
                        className="gap-1.5 rounded-full border border-[#C9A227]/60 bg-[#C9A227] px-4 font-semibold text-[#0A0908] shadow-md shadow-[#C9A227]/10 transition-all duration-200 hover:bg-[#D9BE6C]"
                      >
                        Dashboard
                        <ArrowRight className="size-4" />
                      </Button>
                    </Link>
                  </Magnetic>
                </div>
              ) : (
                <div className="hidden items-center gap-2 sm:flex">
                  <Magnetic strength={26}>
                    <SignInButton mode="modal">
                      <Button
                        size="sm"
                        className={`px-4 ${whiteButtonClasses}`}
                      >
                        Sign in
                      </Button>
                    </SignInButton>
                  </Magnetic>
                  <Magnetic strength={22}>
                    <SignUpButton mode="modal">
                      <Button
                        size="sm"
                        className="rounded-full border border-[#C9A227]/60 bg-[#C9A227] px-5 font-semibold text-[#0A0908] shadow-md shadow-[#C9A227]/10 transition-all duration-200 hover:bg-[#D9BE6C]"
                      >
                        Get started
                      </Button>
                    </SignUpButton>
                  </Magnetic>
                </div>
              )}

              {isSignedIn && <UserButton />}

              <button
                type="button"
                aria-label={menuOpen ? "Close menu" : "Open menu"}
                onClick={() => setMenuOpen((v) => !v)}
                className="flex size-9 items-center justify-center rounded-full border border-[#C9A227]/25 text-[#E9E2D3] transition-colors hover:border-[#C9A227]/50 md:hidden"
              >
                {menuOpen ? (
                  <X className="size-4" />
                ) : (
                  <Menu className="size-4" />
                )}
              </button>
            </div>
          </div>

          <AnimatePresence>
            {menuOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: EASE }}
                className="overflow-hidden md:hidden"
              >
                <div className="flex flex-col gap-1 border-t border-[#C9A227]/15 px-4 py-4">
                  {NAV_LINKS.map((link) => (
                    <a
                      key={link.href}
                      href={link.href}
                      onClick={() => setMenuOpen(false)}
                      className="rounded-lg px-2 py-2.5 text-sm font-medium uppercase tracking-[0.1em] text-[#9C9184] transition-colors hover:bg-[#C9A227]/[0.06] hover:text-[#D9BE6C]"
                    >
                      {link.label}
                    </a>
                  ))}
                  <div className="mt-2 flex flex-col gap-2 border-t border-[#C9A227]/15 pt-4">
                    {isSignedIn ? (
                      <Link href="/app" onClick={() => setMenuOpen(false)}>
                        <Button className="w-full gap-1.5 rounded-full border border-[#C9A227]/60 bg-[#C9A227] font-semibold text-[#0A0908] hover:bg-[#D9BE6C]">
                          Dashboard
                          <ArrowRight className="size-4" />
                        </Button>
                      </Link>
                    ) : (
                      <>
                        <SignInButton mode="modal">
                          <Button className={`w-full ${whiteButtonClasses}`}>
                            Sign in
                          </Button>
                        </SignInButton>
                        <SignUpButton mode="modal">
                          <Button className="w-full rounded-full border border-[#C9A227]/60 bg-[#C9A227] font-semibold text-[#0A0908] hover:bg-[#D9BE6C]">
                            Get started
                          </Button>
                        </SignUpButton>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10 mx-auto max-w-5xl px-5 pt-28 pb-16 text-center sm:px-6 sm:pt-40 sm:pb-20">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE }}
          className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-[#C9A227]/30 bg-[#C9A227]/[0.06] px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#D9BE6C] backdrop-blur-md sm:text-xs"
        >
          <Sparkles className="size-3.5 text-[#C9A227]" strokeWidth={1.75} />
          <span>The future of voice synthesis</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: EASE }}
          className="font-display text-[2.6rem] font-medium leading-[1.05] tracking-tight text-[#F3EDE0] sm:text-7xl lg:text-8xl"
        >
          Your words,
          <br className="hidden sm:inline" />{" "}
          <span className="shimmer-text italic text-transparent bg-gradient-to-r from-[#E8D9B5] via-[#C9A227] to-[#E8D9B5] bg-clip-text">
            flawlessly amplified
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.25, ease: EASE }}
          className="mx-auto mt-7 max-w-2xl px-2 text-base leading-relaxed text-[#9C9184] sm:mt-8 sm:text-xl"
        >
          Professional AI-powered text-to-speech that sounds genuinely human.
          Studio quality across 40+ languages with zero compromise.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: EASE }}
          className="mt-9 flex flex-col items-center justify-center gap-3 sm:mt-10 sm:flex-row sm:gap-4"
        >
          {!isSignedIn ? (
            <Magnetic>
              <SignUpButton mode="modal">
                <Button
                  size="lg"
                  className="glow-pulse h-12 w-full gap-2 rounded-full border border-[#C9A227]/60 bg-[#C9A227] px-8 text-base font-semibold text-[#0A0908] transition-all duration-200 hover:bg-[#D9BE6C] sm:w-auto"
                >
                  Get started
                  <ArrowRight className="size-5" />
                </Button>
              </SignUpButton>
            </Magnetic>
          ) : (
            <Magnetic>
              <Link href="/app" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="glow-pulse h-12 w-full gap-2 rounded-full border border-[#C9A227]/60 bg-[#C9A227] px-8 text-base font-semibold text-[#0A0908] transition-all duration-200 hover:bg-[#D9BE6C] sm:w-auto"
                >
                  Go to Dashboard
                  <ArrowRight className="size-5" />
                </Button>
              </Link>
            </Magnetic>
          )}
          <Magnetic strength={22}>
            <a href="#features" className="w-full sm:w-auto">
              <Button
                size="lg"
                variant="outline"
                className="h-12 w-full gap-2 rounded-full border-[#C9A227]/30 px-8 text-base font-semibold text-black hover:bg-white  sm:w-auto"
              >
                <Play className="size-4" />
                Explore features
              </Button>
            </a>
          </Magnetic>
        </motion.div>

        {/* Gold equalizer */}
        <div className="mt-14 flex items-end justify-center gap-1.5 sm:mt-16">
          {[18, 30, 44, 34, 22, 38, 26].map((h, i) => (
            <div
              key={i}
              className="eq-bar w-1 rounded-full bg-gradient-to-t from-[#8A6A1E] to-[#E8D9B5]"
              style={{ height: `${h}px`, animationDelay: `${i * 130}ms` }}
            />
          ))}
        </div>

        {/* Stats */}
        <Reveal
          delay={0.15}
          className="mx-auto mt-14 grid max-w-2xl grid-cols-2 gap-6 sm:mt-16 sm:grid-cols-4 sm:gap-8"
        >
          {[
            { value: "20+", label: "Studio voices" },
            { value: "99.9%", label: "Uptime" },
            { value: "15ms", label: "Latency" },
            { value: "40+", label: "Languages" },
          ].map((stat) => (
            <div key={stat.label}>
              <p className="font-display text-3xl font-semibold text-[#F3EDE0] sm:text-4xl">
                {stat.value}
              </p>
              <p className="mt-1 text-[10px] uppercase tracking-[0.14em] text-[#9C9184] sm:text-[11px] sm:tracking-[0.16em]">
                {stat.label}
              </p>
            </div>
          ))}
        </Reveal>
      </section>

      {/* Features */}
      <section
        id="features"
        className="relative z-10 mx-auto max-w-6xl px-5 py-16 sm:px-6 sm:py-24"
      >
        <ReignRule />
        <Reveal className="mb-14 text-center sm:mb-20">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#C9A227]">
            Capabilities
          </p>
          <h2 className="font-display text-3xl font-medium tracking-tight text-[#F3EDE0] sm:text-5xl">
            Everything creators actually need
          </h2>
          <p className="mx-auto mt-4 max-w-lg px-2 text-sm text-[#9C9184] sm:text-lg">
            Built by teams who ship. Designed for professionals who demand
            perfection.
          </p>
        </Reveal>

        <div className="grid gap-6 sm:grid-cols-2 sm:gap-8 lg:grid-cols-3">
          {FEATURES.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <Reveal key={feature.title} delay={(i % 3) * 0.08}>
                <FloatingCard className="h-full rounded-2xl border border-[#C9A227]/15 bg-[#0D0A07]/70 p-6 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)] backdrop-blur-md transition-colors duration-300 hover:border-[#C9A227]/40 sm:p-8">
                  <Seal>
                    <Icon className="size-5" strokeWidth={1.5} />
                  </Seal>
                  <h3 className="mt-6 text-lg font-bold text-[#F3EDE0] sm:text-xl">
                    {feature.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-[#9C9184]">
                    {feature.body}
                  </p>
                </FloatingCard>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* Process */}
      <section
        id="how"
        className="relative z-10 mx-auto max-w-6xl px-5 py-16 sm:px-6 sm:py-24"
      >
        <ReignRule />
        <Reveal className="mb-14 text-center sm:mb-20">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#C9A227]">
            Process
          </p>
          <h2 className="font-display text-3xl font-medium tracking-tight text-[#F3EDE0] sm:text-5xl">
            Three steps to professional audio
          </h2>
        </Reveal>

        <div className="grid gap-6 sm:gap-8 md:grid-cols-3">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <Reveal key={step.numeral} delay={i * 0.1}>
                <FloatingCard className="h-full rounded-2xl border border-[#C9A227]/15 bg-[#0D0A07]/70 p-6 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)] backdrop-blur-md sm:p-8">
                  <div className="mb-6 flex items-center justify-between">
                    <span className="font-display text-3xl italic text-[#C9A227]/70">
                      {step.numeral}
                    </span>
                    <Seal size="sm">
                      <Icon className="size-4" strokeWidth={1.5} />
                    </Seal>
                  </div>
                  <h3 className="text-lg font-bold text-[#F3EDE0] sm:text-xl">
                    {step.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-[#9C9184]">
                    {step.body}
                  </p>
                </FloatingCard>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* Pricing */}
      <section
        id="pricing"
        className="relative z-10 mx-auto max-w-6xl px-5 py-16 sm:px-6 sm:py-24"
      >
        <ReignRule />
        <Reveal className="mb-14 text-center sm:mb-20">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#C9A227]">
            Simple pricing
          </p>
          <h2 className="font-display text-3xl font-medium tracking-tight text-[#F3EDE0] sm:text-5xl">
            One plan for every stage of growth
          </h2>
          <p className="mx-auto mt-4 max-w-lg px-2 text-sm text-[#9C9184] sm:text-lg">
            No hidden fees. No surprise bills. Cancel anytime.
          </p>
        </Reveal>

        <div className="grid items-start gap-6 sm:gap-8 md:grid-cols-3">
          {TIERS.map((tier, i) => (
            <Reveal key={tier.name} delay={i * 0.1} y={tier.featured ? 16 : 24}>
              <FloatingCard
                className={`relative h-full rounded-2xl border p-6 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)] backdrop-blur-md sm:p-8 ${
                  tier.featured
                    ? "border-[#C9A227]/50 bg-gradient-to-b from-[#C9A227]/[0.1] to-[#0D0A07]/70 shadow-2xl shadow-[#C9A227]/10 md:-translate-y-4"
                    : "border-[#C9A227]/15 bg-[#0D0A07]/70"
                }`}
              >
                {tier.featured && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full border border-[#C9A227]/60 bg-[#C9A227] px-4 py-1 text-xs font-semibold text-[#0A0908]">
                    Most Popular
                  </span>
                )}
                <h3 className="font-display text-2xl font-semibold text-[#F3EDE0]">
                  {tier.name}
                </h3>
                <p className="mt-2 text-sm text-[#9C9184]">{tier.tagline}</p>
                <p className="mt-6 font-display text-4xl font-semibold text-[#F3EDE0]">
                  {tier.price}
                  <span className="text-base font-normal text-[#9C9184]">
                    /mo
                  </span>
                </p>

                <ul className="mt-8 space-y-3 text-sm">
                  {tier.features.map((f) => (
                    <li
                      key={f}
                      className="flex items-start gap-2 text-[#D9D2C3]"
                    >
                      <Check
                        className="mt-0.5 size-4 shrink-0 text-[#C9A227]"
                        strokeWidth={2}
                      />
                      {f}
                    </li>
                  ))}
                </ul>

                <Magnetic strength={26}>
                  <SignUpButton mode="modal">
                    <Button
                      className={`mt-8 w-full rounded-full font-semibold ${
                        tier.featured
                          ? "border border-[#C9A227]/60 bg-[#C9A227] text-[#0A0908] hover:bg-[#D9BE6C]"
                          : "border border-[#C9A227]/25 bg-transparent text-[#F3EDE0] hover:bg-[#C9A227]/10"
                      }`}
                    >
                      {tier.cta}
                    </Button>
                  </SignUpButton>
                </Magnetic>
              </FloatingCard>
            </Reveal>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 mx-auto max-w-5xl px-5 py-12 text-center sm:px-6 sm:py-16">
        <Reveal>
          <FloatingCard className="relative rounded-2xl border border-[#C9A227]/25 bg-gradient-to-b from-[#0D0A07] to-[#050403] p-7 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)] sm:p-20">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_0%,rgba(201,162,39,0.1),transparent)]" />

            <p className="relative mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#C9A227]">
              Join the future
            </p>
            <h2 className="font-display relative text-3xl font-medium leading-tight text-[#F3EDE0] sm:text-5xl">
              Stop searching for <br className="hidden sm:inline" />
              <span className="italic text-[#D9BE6C]">the perfect voice</span>
            </h2>
            <p className="relative mx-auto mt-4 max-w-md px-2 text-sm leading-relaxed text-[#9C9184] sm:text-base">
              Thousands of creators and teams use KingsTalk to scale audio
              production. No setup, no studio, just results.
            </p>

            <div className="relative mt-9 flex flex-col justify-center gap-3 sm:mt-10 sm:flex-row sm:gap-4">
              {!isSignedIn ? (
                <Magnetic>
                  <SignUpButton mode="modal">
                    <Button
                      size="lg"
                      className="glow-pulse gap-2 rounded-full border border-[#C9A227]/60 bg-[#C9A227] px-8 font-semibold text-[#0A0908] transition-all duration-200 hover:bg-[#D9BE6C]"
                    >
                      Get started today
                      <ArrowRight className="size-5" />
                    </Button>
                  </SignUpButton>
                </Magnetic>
              ) : (
                <Magnetic>
                  <Link href="/app">
                    <Button
                      size="lg"
                      className="glow-pulse gap-2 rounded-full border border-[#C9A227]/60 bg-[#C9A227] px-8 font-semibold text-[#0A0908] transition-all duration-200 hover:bg-[#D9BE6C]"
                    >
                      Go to Dashboard
                      <ArrowRight className="size-5" />
                    </Button>
                  </Link>
                </Magnetic>
              )}
              <Magnetic strength={22}>
                <SignInButton mode="modal">
                  <Button size="lg" className={whiteButtonClasses}>
                    Sign in
                  </Button>
                </SignInButton>
              </Magnetic>
            </div>
          </FloatingCard>
        </Reveal>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-[#C9A227]/15 py-10 text-center text-xs text-[#7A7264] sm:py-12">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-5 sm:flex-row sm:px-6">
          <div className="flex items-center gap-2">
            <div className="flex size-6 items-center justify-center rounded-full border border-[#C9A227]/40 text-[#D9BE6C]">
              <Crown className="size-3.5" strokeWidth={1.75} />
            </div>
            <p>
              &copy; {new Date().getFullYear()} KingsTalk. All rights reserved.
            </p>
          </div>
          {/* <div className="flex gap-6">
            <a
              href="#"
              className="transition-colors duration-200 hover:text-[#D9BE6C]"
            >
              Terms
            </a>
            <a
              href="#"
              className="transition-colors duration-200 hover:text-[#D9BE6C]"
            >
              Privacy
            </a>
            <a
              href="#"
              className="transition-colors duration-200 hover:text-[#D9BE6C]"
            >
              Support
            </a>
          </div> */}
        </div>
      </footer>
    </div>
  );
}
