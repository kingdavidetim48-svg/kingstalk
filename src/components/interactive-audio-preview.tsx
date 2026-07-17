"use client";

import React, { useState, useEffect } from "react";
import { Play, Pause, Volume2, Sparkles, Mic, Flame } from "lucide-react";

interface Voice {
  id: string;
  name: string;
  role: string;
  previewText: string;
  lang: string;
  gender: "female" | "male";
  accent: string;
  pitch: number;
  rate: number;
}

const DEMO_VOICES: Voice[] = [
  {
    id: "serena",
    name: "Serena",
    role: "Professional Narrator",
    previewText: "Welcome to KingsTalk. I can clone your voice in seconds to produce studio-grade audio books and long-form podcasts.",
    lang: "en-US",
    gender: "female",
    accent: "US Professional",
    pitch: 1.1,
    rate: 0.95
  },
  {
    id: "marcus",
    name: "Marcus",
    role: "Promotional & Marketing",
    previewText: "Are you ready to skyrocket your marketing campaign? Try KingsTalk today for high energy voiceovers that sell.",
    lang: "en-GB",
    gender: "male",
    accent: "British Bold",
    pitch: 0.85,
    rate: 1.05
  },
  {
    id: "elena",
    name: "Elena",
    role: "E-Learning Instructor",
    previewText: "Complex concepts become clear when delivered with a calm, friendly, and structured educational voice tone.",
    lang: "en-US",
    gender: "female",
    accent: "Soft Educational",
    pitch: 1.0,
    rate: 0.9
  }
];

export function InteractiveAudioPreview() {
  const [activeVoice, setActiveVoice] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      setSupported(true);
    }
  }, []);

  const handlePlay = (voice: Voice) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    if (activeVoice === voice.id && isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      setActiveVoice(null);
      return;
    }

    // Cancel current speaking
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(voice.previewText);
    
    // Attempt to match a real system voice
    const voices = window.speechSynthesis.getVoices();
    let matchingVoice = null;
    
    if (voice.gender === "female") {
      matchingVoice = voices.find(v => v.lang.startsWith(voice.lang.substring(0, 2)) && (v.name.toLowerCase().includes("female") || v.name.toLowerCase().includes("zira") || v.name.toLowerCase().includes("google") || v.name.toLowerCase().includes("samantha")));
    } else {
      matchingVoice = voices.find(v => v.lang.startsWith(voice.lang.substring(0, 2)) && (v.name.toLowerCase().includes("male") || v.name.toLowerCase().includes("david") || v.name.toLowerCase().includes("google") || v.name.toLowerCase().includes("hazel")));
    }

    if (!matchingVoice) {
      matchingVoice = voices.find(v => v.lang.startsWith(voice.lang.substring(0, 2)));
    }

    if (matchingVoice) {
      utterance.voice = matchingVoice;
    }

    utterance.pitch = voice.pitch;
    utterance.rate = voice.rate;

    utterance.onend = () => {
      setIsPlaying(false);
      setActiveVoice(null);
    };

    utterance.onerror = () => {
      setIsPlaying(false);
      setActiveVoice(null);
    };

    setActiveVoice(voice.id);
    setIsPlaying(true);
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return (
    <div className="w-full max-w-4xl mx-auto mt-16 p-8 rounded-3xl border border-violet-500/10 bg-card/25 backdrop-blur-xl relative overflow-hidden">
      {/* Decorative glows inside card */}
      <div className="absolute -top-24 -left-24 w-48 h-48 rounded-full bg-violet-600/10 blur-[80px]" />
      <div className="absolute -bottom-24 -right-24 w-48 h-48 rounded-full bg-indigo-600/10 blur-[80px]" />

      <div className="relative z-10 grid gap-8 md:grid-cols-12 items-center">
        {/* Left column: explanation */}
        <div className="md:col-span-5 text-left space-y-4">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-violet-500/10 px-3.5 py-1 text-xs font-semibold text-violet-400">
            <Volume2 className="size-3.5" />
            <span>Interactive Demo</span>
          </div>
          <h3 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
            Hear our Voice Engine in Action
          </h3>
          <p className="text-muted-foreground/80 text-sm leading-relaxed">
            Click play on any profile to synthesize voice output in real-time. Notice the accurate rhythm and clarity.
          </p>
          
          <div className="pt-2 flex items-center gap-4 text-xs text-muted-foreground/70">
            <span className="flex items-center gap-1"><Mic className="size-3.5 text-violet-500" /> 44.1kHz WAV</span>
            <span className="flex items-center gap-1"><Flame className="size-3.5 text-indigo-500" /> &lt; 1s Latency</span>
          </div>
        </div>

        {/* Right column: voice selectors */}
        <div className="md:col-span-7 space-y-4">
          {DEMO_VOICES.map((voice) => {
            const isCurrent = activeVoice === voice.id && isPlaying;
            return (
              <div 
                key={voice.id}
                onClick={() => handlePlay(voice)}
                className={`group flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 cursor-pointer ${
                  isCurrent 
                    ? "border-violet-500 bg-violet-500/5 shadow-lg shadow-violet-500/5" 
                    : "border-border/40 bg-card/45 hover:border-violet-500/30 hover:bg-card/70"
                }`}
              >
                <div className="flex items-center gap-4">
                  {/* Play Button Icon */}
                  <div className={`flex size-12 items-center justify-center rounded-xl transition-all duration-300 ${
                    isCurrent 
                      ? "bg-violet-600 text-white scale-105" 
                      : "bg-muted text-muted-foreground group-hover:bg-violet-600/10 group-hover:text-violet-500"
                  }`}>
                    {isCurrent ? <Pause className="size-5" /> : <Play className="size-5 fill-current" />}
                  </div>

                  {/* Profile info */}
                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-foreground text-base group-hover:text-violet-400 transition-colors">
                        {voice.name}
                      </span>
                      <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-muted text-muted-foreground/90">
                        {voice.accent}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground/80 block mt-0.5">
                      {voice.role}
                    </span>
                  </div>
                </div>

                {/* Waveform / Visualizer */}
                <div className="flex items-center gap-1.5 h-6">
                  {isCurrent ? (
                    <div className="flex items-end gap-0.5 h-full">
                      {[1.2, 2.5, 1.8, 2.2, 1.0, 2.7, 1.5, 2.0, 0.8, 1.6].map((multiplier, i) => (
                        <div 
                          key={i} 
                          className="w-[3px] rounded-full bg-gradient-to-t from-violet-600 to-indigo-500 animate-pulse"
                          style={{
                            height: `${Math.floor(8 + multiplier * 6)}px`,
                            animationDuration: `${0.4 + i * 0.08}s`,
                            animationDelay: `${i * 0.05}s`
                          }}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-end gap-0.5 h-full opacity-30">
                      {[2, 3, 2, 4, 2, 3, 2, 3, 2, 2].map((height, i) => (
                        <div 
                          key={i} 
                          className="w-[3px] rounded-full bg-foreground"
                          style={{ height: `${height * 3}px` }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
