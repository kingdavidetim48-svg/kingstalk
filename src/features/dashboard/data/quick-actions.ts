export interface QuickAction {
  title: string;
  description: string;
  gradient: string;
  href: string;
}

export const quickActions: QuickAction[] = [
  {
    title: "Narrate a Story",
    description: "Bring characters to life with expressive AI narration.",
    gradient: "from-cyan-400 to-cyan-50",
    href: "/text-to-speech?text=In a village tucked between mist-covered mountains, there lived an old clockmaker whose clocks never told the right time, but they always told the truth. One rainy evening, a stranger walked in and asked for a clock that could show him his future.",
  },
  {
    title: "Guide a Meditation",
    description: "Create a calm, soothing voice for mindfulness sessions.",
    gradient: "from-emerald-400 to-emerald-50",
    href: "/text-to-speech?text=Close your eyes and take a slow, deep breath. Feel the air filling your lungs, and as you exhale, allow any tension to gently leave your body. Focus only on this moment.",
  },
  {
    title: "Introduce Your Podcast",
    description: "Generate a professional and engaging podcast intro.",
    gradient: "from-violet-500 to-violet-50",
    href: "/text-to-speech?text=Welcome back to the Future Makers Podcast, where we explore the ideas, people, and technologies shaping tomorrow. I'm your host, and today we have an exciting episode ahead.",
  },
  {
    title: "Voice a Game Character",
    description: "Give life to heroes, villains, and fantasy characters.",
    gradient: "from-orange-500 to-orange-50",
    href: "/text-to-speech?text=Halt, traveler! These lands have been cursed for a thousand years. If you seek the Crystal of Dawn, you must first prove your courage in the trials ahead.",
  },
  {
    title: "Direct a Movie Scene",
    description: "Craft dramatic dialogue and cinematic narration.",
    gradient: "from-rose-500 to-rose-50",
    href: "/text-to-speech?text=The room fell silent as the detective placed the photograph on the table. Everyone knew what it meant. The truth they had been avoiding could no longer stay hidden.",
  },
  {
    title: "Record an Ad",
    description: "Produce compelling promotional voiceovers in seconds.",
    gradient: "from-amber-500 to-amber-50",
    href: "/text-to-speech?text=Introducing KingsTalk, the fastest way to transform your words into natural, studio-quality speech. Create voiceovers, podcasts, and content in minutes. Try it today.",
  },
];
