import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import clsx from 'clsx';
import {
  Swords,
  Shield,
  Trophy,
  Users,
  AlertTriangle,
  ShieldCheck,
  BarChart3,
  Cpu,
  Zap,
  Play,
  ChevronDown,
  ArrowRight,
  Brain,
  Target,
  BookOpen,
  Crown,
  Sparkles,
  Globe,
  Lightbulb,
  Share2,
  Quote,
  Github,
  MessageCircle,
  FileText,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface LandingViewProps {
  onGetStarted: () => void;
  onExploreFeatures: () => void;
}

// ---------------------------------------------------------------------------
// Reduced motion check
// ---------------------------------------------------------------------------
function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// ---------------------------------------------------------------------------
// useInView -- scroll-triggered visibility with IntersectionObserver
// ---------------------------------------------------------------------------
function useInView(threshold = 0.15): [React.RefObject<HTMLDivElement | null>, boolean] {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (prefersReducedMotion()) {
      setVisible(true);
      return;
    }
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);

  return [ref, visible];
}

// ---------------------------------------------------------------------------
// useCountUp -- animate a number from 0 to target
// ---------------------------------------------------------------------------
function useCountUp(target: number, active: boolean, duration = 1400): number {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!active) return;
    if (prefersReducedMotion()) {
      setValue(target);
      return;
    }
    let start: number | null = null;
    let raf: number;
    const step = (ts: number) => {
      if (start === null) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      setValue(Math.round(eased * target));
      if (progress < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, active, duration]);

  return value;
}

// ---------------------------------------------------------------------------
// useTypewriter -- cycles through an array of words with typing/deleting
// ---------------------------------------------------------------------------
function useTypewriter(
  words: string[],
  typingSpeed = 100,
  deletingSpeed = 60,
  pauseDuration = 2000,
): { text: string; isDeleting: boolean } {
  const [wordIndex, setWordIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (prefersReducedMotion()) return;

    const currentWord = words[wordIndex];

    const timeout = setTimeout(
      () => {
        if (!isDeleting) {
          if (charIndex < currentWord.length) {
            setCharIndex((c) => c + 1);
          } else {
            setTimeout(() => setIsDeleting(true), pauseDuration);
          }
        } else {
          if (charIndex > 0) {
            setCharIndex((c) => c - 1);
          } else {
            setIsDeleting(false);
            setWordIndex((i) => (i + 1) % words.length);
          }
        }
      },
      isDeleting ? deletingSpeed : typingSpeed,
    );

    return () => clearTimeout(timeout);
  }, [charIndex, isDeleting, wordIndex, words, typingSpeed, deletingSpeed, pauseDuration]);

  const currentWord = words[wordIndex];
  return {
    text: prefersReducedMotion() ? currentWord : currentWord.slice(0, charIndex),
    isDeleting,
  };
}

// ---------------------------------------------------------------------------
// Floating particles background
// ---------------------------------------------------------------------------
const Particles: React.FC = React.memo(() => {
  const dots = useMemo(
    () =>
      Array.from({ length: 50 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: 1.5 + Math.random() * 2.5,
        duration: 15 + Math.random() * 25,
        delay: Math.random() * 12,
        opacity: 0.1 + Math.random() * 0.2,
      })),
    [],
  );

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {dots.map((d) => (
        <span
          key={d.id}
          className="absolute rounded-full bg-white"
          style={{
            left: `${d.x}%`,
            top: `${d.y}%`,
            width: d.size,
            height: d.size,
            opacity: d.opacity,
            animation: prefersReducedMotion()
              ? 'none'
              : `landingFloat ${d.duration}s ease-in-out ${d.delay}s infinite alternate`,
          }}
        />
      ))}
    </div>
  );
});
Particles.displayName = 'Particles';

// ---------------------------------------------------------------------------
// Feature card data & component
// ---------------------------------------------------------------------------
interface FeatureItem {
  icon: React.FC<{ className?: string }>;
  title: string;
  description: string;
  color: string;
  bgColor: string;
}

const FEATURES: FeatureItem[] = [
  {
    icon: Cpu,
    title: 'Multi-Model Arena',
    description: 'Pit Claude, GPT-4, Gemini, Ollama, and LM Studio models head-to-head in structured debates.',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
  },
  {
    icon: BookOpen,
    title: 'Oxford Union Format',
    description: 'Authentic Oxford-style debate structure with opening statements, rebuttals, and closing arguments.',
    color: 'text-indigo-500',
    bgColor: 'bg-indigo-500/10',
  },
  {
    icon: BarChart3,
    title: 'Real-Time Momentum',
    description: 'Live momentum tracking visualizes which side is winning as arguments unfold in real time.',
    color: 'text-cyan-500',
    bgColor: 'bg-cyan-500/10',
  },
  {
    icon: AlertTriangle,
    title: 'Fallacy Detection',
    description: 'Automatic identification of 20+ logical fallacies with severity ratings and clear explanations.',
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
  },
  {
    icon: ShieldCheck,
    title: 'Evidence Verification',
    description: 'Real-time fact-checking with credibility scoring and source classification for every claim.',
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
  },
  {
    icon: Users,
    title: 'Custom Personas',
    description: 'Create unique debater personas with distinct expertise, rhetorical styles, and argumentation strategies.',
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
  },
  {
    icon: Crown,
    title: 'ELO Rankings',
    description: 'Chess-style rating system tracks model performance over time with detailed head-to-head records.',
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/10',
  },
  {
    icon: Trophy,
    title: 'Tournament Mode',
    description: 'Run bracket-style tournaments across multiple models and topics with automated scheduling.',
    color: 'text-rose-500',
    bgColor: 'bg-rose-500/10',
  },
  {
    icon: Share2,
    title: 'Export & Share',
    description: 'Export debates as Markdown, HTML, or shareable cards. Save transcripts and share the best moments.',
    color: 'text-teal-500',
    bgColor: 'bg-teal-500/10',
  },
];

const FeatureCard: React.FC<{ feature: FeatureItem; index: number; visible: boolean }> = ({
  feature,
  index,
  visible,
}) => {
  const Icon = feature.icon;
  return (
    <div
      className={clsx(
        'group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 transition-all duration-500',
        'hover:shadow-xl hover:-translate-y-2 hover:border-gray-300',
        'dark:border-surface-dark-3 dark:bg-surface-dark-1 dark:hover:border-surface-dark-4 dark:hover:shadow-2xl dark:hover:shadow-forge-900/10',
        visible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0',
      )}
      style={{ transitionDelay: `${index * 80}ms` }}
    >
      <div
        className={clsx(
          'mb-4 flex h-12 w-12 items-center justify-center rounded-xl transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg',
          feature.bgColor,
        )}
      >
        <Icon className={clsx('h-6 w-6 transition-colors duration-300', feature.color)} />
      </div>
      <h3 className="mb-1.5 text-base font-bold text-gray-900 dark:text-gray-100">{feature.title}</h3>
      <p className="text-sm leading-relaxed text-gray-500 dark:text-gray-400">{feature.description}</p>

      {/* Decorative corner glow */}
      <div
        className={clsx(
          'absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-0 transition-opacity duration-300 group-hover:opacity-100 blur-2xl',
          feature.bgColor,
        )}
      />
    </div>
  );
};

// ---------------------------------------------------------------------------
// How It Works steps
// ---------------------------------------------------------------------------
interface StepItem {
  icon: React.FC<{ className?: string }>;
  title: string;
  description: string;
}

const STEPS: StepItem[] = [
  {
    icon: Lightbulb,
    title: 'Choose a Topic',
    description: 'Pick any topic or use our smart generator to find thought-provoking debate motions.',
  },
  {
    icon: Swords,
    title: 'Select Your Fighters',
    description: 'Choose AI models and assign debate personas with unique rhetorical styles.',
  },
  {
    icon: Zap,
    title: 'Watch the Clash',
    description: 'AI models debate in real-time with streaming responses, evidence, and live analysis.',
  },
  {
    icon: BarChart3,
    title: 'Analyze the Results',
    description: 'Review scores, fallacies, evidence quality, and momentum shifts across every round.',
  },
];

// ---------------------------------------------------------------------------
// Showcase / Demo section with fake browser frame
// ---------------------------------------------------------------------------
const PROPOSITION_TEXT =
  'The evidence overwhelmingly supports that AI regulation must be proactive rather than reactive. The EU AI Act demonstrates that structured oversight accelerates responsible innovation by providing clear boundaries, not barriers, for development. We cannot afford to wait for catastrophic failures before acting.';

const OPPOSITION_TEXT =
  'While regulatory frameworks have their place, premature regulation risks stifling the very innovation it claims to protect. History shows us that early internet regulations in restrictive nations led to decades of technological stagnation. We should pursue industry self-governance with transparent accountability measures instead.';

const ShowcaseDemo: React.FC<{ visible: boolean }> = ({ visible }) => {
  const [propChars, setPropChars] = useState(0);
  const [oppChars, setOppChars] = useState(0);

  useEffect(() => {
    if (!visible || prefersReducedMotion()) {
      if (visible) {
        setPropChars(PROPOSITION_TEXT.length);
        setOppChars(OPPOSITION_TEXT.length);
      }
      return;
    }

    let propTimeout: ReturnType<typeof setTimeout>;
    let oppTimeout: ReturnType<typeof setTimeout>;
    let propIdx = 0;
    let oppIdx = 0;

    const typeProp = () => {
      if (propIdx <= PROPOSITION_TEXT.length) {
        setPropChars(propIdx);
        propIdx++;
        propTimeout = setTimeout(typeProp, 12);
      }
    };

    const typeOpp = () => {
      if (oppIdx <= OPPOSITION_TEXT.length) {
        setOppChars(oppIdx);
        oppIdx++;
        oppTimeout = setTimeout(typeOpp, 12);
      }
    };

    // Start proposition first, then opposition after a delay
    propTimeout = setTimeout(typeProp, 500);
    oppTimeout = setTimeout(typeOpp, 2000);

    return () => {
      clearTimeout(propTimeout);
      clearTimeout(oppTimeout);
    };
  }, [visible]);

  return (
    <div
      className={clsx(
        'mx-auto max-w-4xl transition-all duration-700',
        visible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0',
      )}
    >
      {/* Browser frame */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl dark:border-surface-dark-3 dark:bg-surface-dark-1">
        {/* Title bar */}
        <div className="flex items-center gap-2 border-b border-gray-200 bg-gray-50 px-4 py-3 dark:border-surface-dark-3 dark:bg-surface-dark-2">
          <div className="flex gap-1.5">
            <div className="h-3 w-3 rounded-full bg-red-400" />
            <div className="h-3 w-3 rounded-full bg-yellow-400" />
            <div className="h-3 w-3 rounded-full bg-green-400" />
          </div>
          <div className="mx-auto flex items-center gap-2 rounded-md bg-gray-200/70 px-4 py-1 text-xs text-gray-500 dark:bg-surface-dark-3 dark:text-gray-400">
            <Swords className="h-3 w-3" />
            DebateForge &mdash; Should AI be regulated?
          </div>
        </div>

        {/* Content area */}
        <div className="relative p-6 sm:p-8">
          {/* Topic header */}
          <div className="mb-6 text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-forge-100 px-3 py-1 text-xs font-semibold text-forge-700 dark:bg-forge-900/30 dark:text-forge-400">
              <Zap className="h-3 w-3" /> Live Debate
            </span>
            <h4 className="mt-2 text-lg font-bold text-gray-900 dark:text-gray-100">
              &ldquo;Should AI development be regulated by governments?&rdquo;
            </h4>
          </div>

          {/* Speech bubbles */}
          <div className="space-y-4">
            {/* Proposition */}
            <div className="flex gap-3">
              <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-500/10">
                <Brain className="h-4 w-4 text-blue-500" />
              </div>
              <div className="flex-1 rounded-2xl rounded-tl-sm border border-blue-200 bg-blue-50/50 p-4 dark:border-blue-900/30 dark:bg-blue-950/20">
                <div className="mb-1 flex items-center gap-2">
                  <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                    Claude Sonnet 4 &mdash; Proposition
                  </span>
                </div>
                <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                  {PROPOSITION_TEXT.slice(0, propChars)}
                  {propChars < PROPOSITION_TEXT.length && (
                    <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-blue-500 align-middle" />
                  )}
                </p>
              </div>
            </div>

            {/* Opposition */}
            <div className="flex gap-3">
              <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rose-500/10">
                <Sparkles className="h-4 w-4 text-rose-500" />
              </div>
              <div className="flex-1 rounded-2xl rounded-tl-sm border border-rose-200 bg-rose-50/50 p-4 dark:border-rose-900/30 dark:bg-rose-950/20">
                <div className="mb-1 flex items-center gap-2">
                  <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
                    GPT-4o &mdash; Opposition
                  </span>
                </div>
                <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                  {OPPOSITION_TEXT.slice(0, oppChars)}
                  {oppChars < OPPOSITION_TEXT.length && oppChars > 0 && (
                    <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-rose-500 align-middle" />
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Annotation bubbles */}
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {[
              { label: 'Real-time streaming', color: 'text-blue-500 bg-blue-500/10 border-blue-200 dark:border-blue-800' },
              { label: 'Fallacy detection', color: 'text-amber-500 bg-amber-500/10 border-amber-200 dark:border-amber-800' },
              { label: 'Momentum tracking', color: 'text-emerald-500 bg-emerald-500/10 border-emerald-200 dark:border-emerald-800' },
            ].map((a) => (
              <span
                key={a.label}
                className={clsx(
                  'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium',
                  a.color,
                )}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                {a.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Testimonial data & component
// ---------------------------------------------------------------------------
interface Testimonial {
  quote: string;
  name: string;
  role: string;
  initials: string;
  color: string;
}

const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      'DebateForge completely changed how I think about AI capabilities. Watching models argue in real-time reveals reasoning patterns you never see in standard benchmarks.',
    name: 'Sarah Chen',
    role: 'AI Researcher',
    initials: 'SC',
    color: 'bg-blue-500',
  },
  {
    quote:
      'The fallacy detection alone is worth it. My students love watching models argue and catching logical errors in real time. It\'s become our favorite teaching tool.',
    name: 'Dr. Marcus Webb',
    role: 'Philosophy Professor',
    initials: 'MW',
    color: 'bg-purple-500',
  },
  {
    quote:
      'Finally, a tool that lets me compare AI reasoning head-to-head. The Oxford-style format makes the analysis rigorous and the ELO rankings keep things competitive.',
    name: 'Alex Rivera',
    role: 'Tech Journalist',
    initials: 'AR',
    color: 'bg-emerald-500',
  },
];

const TestimonialCard: React.FC<{ testimonial: Testimonial; index: number; visible: boolean }> = ({
  testimonial,
  index,
  visible,
}) => (
  <div
    className={clsx(
      'relative flex flex-col rounded-2xl border border-gray-200 bg-white p-6 transition-all duration-500',
      'dark:border-surface-dark-3 dark:bg-surface-dark-1',
      'hover:shadow-lg hover:-translate-y-1',
      visible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0',
    )}
    style={{ transitionDelay: `${index * 150}ms` }}
  >
    <Quote className="mb-3 h-8 w-8 text-forge-300 dark:text-forge-700" />
    <p className="mb-6 flex-1 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
      &ldquo;{testimonial.quote}&rdquo;
    </p>
    <div className="flex items-center gap-3">
      <div
        className={clsx(
          'flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white',
          testimonial.color,
        )}
      >
        {testimonial.initials}
      </div>
      <div>
        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{testimonial.name}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">{testimonial.role}</p>
      </div>
    </div>
  </div>
);

// ---------------------------------------------------------------------------
// Stats data
// ---------------------------------------------------------------------------
interface StatItem {
  value: number;
  prefix?: string;
  suffix: string;
  label: string;
  icon: React.FC<{ className?: string }>;
}

const STATS: StatItem[] = [
  { value: 6, suffix: '+', label: 'AI Models Supported', icon: Cpu },
  { value: 3, suffix: '', label: 'Debate Formats', icon: BookOpen },
  { value: 20, suffix: '+', label: 'Fallacies Detected', icon: AlertTriangle },
  { value: 0, prefix: '\u221E', suffix: '', label: 'Topics to Explore', icon: Globe },
];

const StatCounter: React.FC<{ stat: StatItem; active: boolean; index: number }> = ({ stat, active, index }) => {
  const count = useCountUp(stat.value, active);
  const Icon = stat.icon;
  return (
    <div
      className={clsx(
        'flex flex-col items-center text-center transition-all duration-700',
        active ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0',
      )}
      style={{ transitionDelay: `${index * 120}ms` }}
    >
      <Icon className="mb-3 h-7 w-7 text-forge-400" />
      <span className="text-4xl font-extrabold tabular-nums text-gray-900 dark:text-white sm:text-5xl">
        {stat.prefix ? stat.prefix : count}
        {stat.suffix}
      </span>
      <span className="mt-2 text-sm font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
        {stat.label}
      </span>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Inject keyframes for custom animations (once)
// ---------------------------------------------------------------------------
const LANDING_STYLES_ID = 'landing-view-keyframes';

function injectLandingStyles() {
  if (document.getElementById(LANDING_STYLES_ID)) return;
  const style = document.createElement('style');
  style.id = LANDING_STYLES_ID;
  style.textContent = `
    @keyframes landingFloat {
      0% { transform: translateY(0) translateX(0); }
      100% { transform: translateY(-20px) translateX(8px); }
    }
    @keyframes landingGlowPulse {
      0%, 100% { box-shadow: 0 0 20px rgba(92,124,250,0.3), 0 0 60px rgba(92,124,250,0.1); }
      50% { box-shadow: 0 0 30px rgba(92,124,250,0.5), 0 0 80px rgba(92,124,250,0.25); }
    }
    @keyframes landingBounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(8px); }
    }
    @keyframes landingLineGrow {
      0% { height: 0; }
      100% { height: 100%; }
    }
    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
      }
    }
  `;
  document.head.appendChild(style);
}

// ---------------------------------------------------------------------------
// Main LandingView Component
// ---------------------------------------------------------------------------
const LandingView: React.FC<LandingViewProps> = ({ onGetStarted, onExploreFeatures }) => {
  useEffect(() => {
    injectLandingStyles();
  }, []);

  // Typewriter for cycling words
  const CYCLING_WORDS = useMemo(() => ['Philosophy', 'Politics', 'Science', 'Ethics', 'Technology'], []);
  const { text: typewriterText } = useTypewriter(CYCLING_WORDS);

  // Scroll-triggered section refs
  const [featuresRef, featuresVisible] = useInView(0.05);
  const [stepsRef, stepsVisible] = useInView(0.1);
  const [showcaseRef, showcaseVisible] = useInView(0.1);
  const [testimonialsRef, testimonialsVisible] = useInView(0.1);
  const [statsRef, statsVisible] = useInView(0.2);
  const [ctaRef, ctaVisible] = useInView(0.2);

  // Scroll-to for explore features
  const featuresSectionRef = useRef<HTMLDivElement>(null);
  const handleExploreFeatures = useCallback(() => {
    featuresSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    onExploreFeatures();
  }, [onExploreFeatures]);

  // Smooth scroll to features from hero bounce indicator
  const scrollToContent = useCallback(() => {
    featuresSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  return (
    <div className="relative min-h-screen overflow-y-auto overflow-x-hidden bg-white dark:bg-surface-dark-0" style={{ scrollBehavior: 'smooth' }}>
      {/* ================================================================ */}
      {/* HERO SECTION                                                     */}
      {/* ================================================================ */}
      <section className="relative flex min-h-screen flex-col overflow-hidden">
        {/* Background gradient */}
        <div
          className="absolute inset-0 bg-gradient-to-br from-gray-950 via-surface-dark-0 to-gray-950"
          aria-hidden
        />

        {/* Radial glow forge color */}
        <div
          className="absolute left-1/2 top-1/3 h-[700px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-forge-600/15 blur-[150px]"
          aria-hidden
        />
        <div
          className="absolute right-1/4 top-2/3 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-purple-600/10 blur-[120px]"
          aria-hidden
        />

        {/* Floating particles */}
        <Particles />

        {/* Dot pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
          aria-hidden
        />

        {/* Hero Content */}
        <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-20 text-center">
          {/* Social proof pill */}
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-2 text-sm font-medium text-white/70 backdrop-blur-sm">
            <Zap className="h-4 w-4 text-yellow-400" />
            6 AI Models &bull; 3 Debate Formats &bull; Real-time Analysis
          </div>

          {/* Main headline */}
          <h1 className="mb-2 text-5xl font-extrabold leading-[1.1] tracking-tight sm:text-6xl md:text-7xl lg:text-8xl">
            <span className="text-white">Where </span>
            <span
              className="bg-gradient-to-r from-forge-400 to-forge-600 bg-clip-text text-transparent"
              style={{ WebkitBackgroundClip: 'text' }}
            >
              AI Minds
            </span>
            <span className="text-white"> Clash</span>
          </h1>

          {/* Typewriter line */}
          <div className="mb-6 flex h-12 items-center justify-center text-2xl font-semibold text-white/50 sm:text-3xl md:text-4xl">
            <span className="bg-gradient-to-r from-purple-400 to-forge-400 bg-clip-text text-transparent" style={{ WebkitBackgroundClip: 'text' }}>
              {typewriterText}
            </span>
            <span className="ml-1 inline-block h-8 w-[3px] rounded-full bg-forge-400 animate-pulse-soft sm:h-10" />
          </div>

          {/* Sub-headline */}
          <p className="mx-auto mb-10 max-w-2xl text-base leading-relaxed text-white/50 sm:text-lg">
            Pit the world&rsquo;s most powerful AI models against each other in structured Oxford-style debates.
            Watch them argue, analyze their logic, and discover who makes the strongest case.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col gap-4 sm:flex-row">
            <button
              onClick={onGetStarted}
              className="group inline-flex items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-forge-500 to-forge-600 px-8 py-4 text-base font-bold text-white shadow-lg shadow-forge-600/30 transition-all duration-200 hover:shadow-xl hover:shadow-forge-500/40 active:scale-[0.98]"
              style={{ animation: 'landingGlowPulse 3s ease-in-out infinite' }}
            >
              <Swords className="h-5 w-5 transition-transform duration-200 group-hover:rotate-12" />
              Enter the Arena
            </button>
            <button
              onClick={handleExploreFeatures}
              className="inline-flex items-center justify-center gap-2.5 rounded-xl border-2 border-white/15 bg-white/5 px-8 py-4 text-base font-bold text-white/80 backdrop-blur-sm transition-all duration-200 hover:border-white/30 hover:bg-white/10 active:scale-[0.98]"
            >
              <Play className="h-4 w-4" />
              Watch a Demo
            </button>
          </div>
        </div>

        {/* Bouncing scroll indicator */}
        <div className="relative z-10 pb-8 text-center">
          <button
            onClick={scrollToContent}
            className="mx-auto flex flex-col items-center gap-1 text-white/30 transition-colors hover:text-white/60"
            aria-label="Scroll to content"
          >
            <span className="text-xs font-medium uppercase tracking-widest">Scroll</span>
            <ChevronDown
              className="h-5 w-5"
              style={{ animation: 'landingBounce 2s ease-in-out infinite' }}
            />
          </button>
        </div>
      </section>

      {/* ================================================================ */}
      {/* FEATURES GRID                                                    */}
      {/* ================================================================ */}
      <section
        ref={(el: HTMLDivElement | null) => {
          (featuresRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
          (featuresSectionRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
        }}
        className="mx-auto max-w-6xl px-6 py-20 sm:py-28"
      >
        <div className="mb-14 text-center">
          <h2 className="mb-4 text-3xl font-extrabold text-gray-900 dark:text-white sm:text-4xl">
            Everything you need for the ultimate AI showdown
          </h2>
          <p className="mx-auto max-w-2xl text-base text-gray-500 dark:text-gray-400">
            A comprehensive toolkit for staging, analyzing, and learning from structured AI-vs-AI debates.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <FeatureCard key={f.title} feature={f} index={i} visible={featuresVisible} />
          ))}
        </div>
      </section>

      {/* ================================================================ */}
      {/* HOW IT WORKS                                                     */}
      {/* ================================================================ */}
      <section
        ref={stepsRef}
        className="border-y border-gray-100 bg-gray-50/70 py-20 dark:border-surface-dark-3 dark:bg-surface-dark-1/50 sm:py-28"
      >
        <div className="mx-auto max-w-5xl px-6">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-extrabold text-gray-900 dark:text-white sm:text-4xl">
              How It Works
            </h2>
            <p className="mx-auto max-w-lg text-base text-gray-500 dark:text-gray-400">
              From topic selection to detailed analysis in four simple steps.
            </p>
          </div>

          {/* Steps with connecting lines */}
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.title}
                  className={clsx(
                    'relative flex flex-col items-center text-center transition-all duration-700',
                    stepsVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0',
                  )}
                  style={{ transitionDelay: `${i * 180}ms` }}
                >
                  {/* Connector line (not on last item) */}
                  {i < STEPS.length - 1 && (
                    <div className="pointer-events-none absolute left-[calc(50%+2.5rem)] top-8 hidden h-0.5 w-[calc(100%-3rem)] lg:block" aria-hidden>
                      <div
                        className={clsx(
                          'h-full bg-gradient-to-r from-forge-400/40 to-forge-500/40 transition-all duration-1000',
                          stepsVisible ? 'w-full' : 'w-0',
                        )}
                        style={{ transitionDelay: `${(i + 1) * 300}ms` }}
                      />
                    </div>
                  )}

                  {/* Step icon circle */}
                  <div className="relative mb-5">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-forge-500 to-forge-700 shadow-lg shadow-forge-500/25">
                      <Icon className="h-7 w-7 text-white" />
                    </div>
                    <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs font-bold text-forge-700 shadow-md ring-2 ring-forge-200 dark:bg-surface-dark-1 dark:text-forge-400 dark:ring-forge-800">
                      {i + 1}
                    </span>
                  </div>

                  <h4 className="mb-2 text-base font-bold text-gray-900 dark:text-gray-100">{step.title}</h4>
                  <p className="mx-auto max-w-[220px] text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                    {step.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* SHOWCASE / DEMO                                                  */}
      {/* ================================================================ */}
      <section ref={showcaseRef} className="mx-auto max-w-5xl px-6 py-20 sm:py-28">
        <div className="mb-14 text-center">
          <h2 className="mb-4 text-3xl font-extrabold text-gray-900 dark:text-white sm:text-4xl">
            See it in action
          </h2>
          <p className="mx-auto max-w-lg text-base text-gray-500 dark:text-gray-400">
            Watch AI models clash in real-time with evidence, fallacy detection, and momentum tracking.
          </p>
        </div>
        <ShowcaseDemo visible={showcaseVisible} />
      </section>

      {/* ================================================================ */}
      {/* TESTIMONIALS                                                     */}
      {/* ================================================================ */}
      <section
        ref={testimonialsRef}
        className="border-y border-gray-100 bg-gray-50/70 py-20 dark:border-surface-dark-3 dark:bg-surface-dark-1/50 sm:py-28"
      >
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-14 text-center">
            <h2 className="mb-4 text-3xl font-extrabold text-gray-900 dark:text-white sm:text-4xl">
              What Users Say
            </h2>
            <p className="mx-auto max-w-lg text-base text-gray-500 dark:text-gray-400">
              Join researchers, educators, and tech enthusiasts who use DebateForge to explore AI reasoning.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {TESTIMONIALS.map((t, i) => (
              <TestimonialCard key={t.name} testimonial={t} index={i} visible={testimonialsVisible} />
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* STATS COUNTER                                                    */}
      {/* ================================================================ */}
      <section ref={statsRef} className="py-20 sm:py-24">
        <div className="mx-auto grid max-w-4xl grid-cols-2 gap-10 px-6 sm:grid-cols-4">
          {STATS.map((stat, i) => (
            <StatCounter key={stat.label} stat={stat} active={statsVisible} index={i} />
          ))}
        </div>
      </section>

      {/* ================================================================ */}
      {/* FINAL CTA                                                        */}
      {/* ================================================================ */}
      <section ref={ctaRef} className="relative overflow-hidden">
        <div
          className="absolute inset-0 bg-gradient-to-br from-forge-600 via-forge-700 to-purple-800"
          aria-hidden
        />
        {/* Dot pattern */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
          aria-hidden
        />
        {/* Radial glow */}
        <div
          className="absolute left-1/2 top-1/2 h-[500px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/5 blur-[140px]"
          aria-hidden
        />
        {/* Floating particles */}
        <Particles />

        <div
          className={clsx(
            'relative z-10 mx-auto max-w-3xl px-6 py-20 text-center transition-all duration-700 sm:py-28',
            ctaVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0',
          )}
        >
          <h2 className="mb-4 text-3xl font-extrabold text-white sm:text-4xl lg:text-5xl">
            Ready to enter the arena?
          </h2>
          <p className="mx-auto mb-10 max-w-lg text-lg text-white/60">
            Start your first AI debate in under 30 seconds.
          </p>
          <button
            onClick={onGetStarted}
            className="group inline-flex items-center justify-center gap-3 rounded-xl bg-white px-10 py-4 text-lg font-bold text-forge-700 shadow-xl transition-all duration-200 hover:bg-gray-50 hover:shadow-2xl active:scale-[0.98]"
            style={{ animation: 'landingGlowPulse 3s ease-in-out infinite' }}
          >
            <ArrowRight className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-1" />
            Get Started
          </button>
        </div>
      </section>

      {/* ================================================================ */}
      {/* FOOTER                                                           */}
      {/* ================================================================ */}
      <footer className="border-t border-gray-100 bg-white py-12 dark:border-surface-dark-3 dark:bg-surface-dark-0">
        <div className="mx-auto max-w-6xl px-6">
          {/* 3 column links */}
          <div className="mb-10 grid grid-cols-1 gap-8 sm:grid-cols-3">
            {/* Product */}
            <div>
              <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-gray-100">
                Product
              </h4>
              <ul className="space-y-2.5">
                {[
                  { label: 'Features', action: handleExploreFeatures },
                  { label: 'Changelog', action: onGetStarted },
                  { label: 'Help', action: onGetStarted },
                ].map((item) => (
                  <li key={item.label}>
                    <button
                      onClick={item.action}
                      className="text-sm text-gray-500 transition-colors hover:text-forge-600 dark:text-gray-400 dark:hover:text-forge-400"
                    >
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Community */}
            <div>
              <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-gray-100">
                Community
              </h4>
              <ul className="space-y-2.5">
                {[
                  { label: 'GitHub', icon: Github },
                  { label: 'Discord', icon: MessageCircle },
                ].map((item) => (
                  <li key={item.label}>
                    <span className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                      <item.icon className="h-3.5 w-3.5" />
                      {item.label}
                      <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-400 dark:bg-surface-dark-3 dark:text-gray-500">
                        Soon
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-gray-100">
                Legal
              </h4>
              <ul className="space-y-2.5">
                {['Privacy Policy', 'Terms of Service'].map((item) => (
                  <li key={item}>
                    <span className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                      {item}
                      <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-400 dark:bg-surface-dark-3 dark:text-gray-500">
                        Placeholder
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Divider */}
          <div className="mb-6 border-t border-gray-100 dark:border-surface-dark-3" />

          {/* Bottom bar */}
          <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-forge-500 to-forge-700">
                <Swords className="h-4 w-4 text-white" />
              </div>
              <span className="text-sm font-bold text-gray-900 dark:text-gray-100">DebateForge</span>
            </div>

            {/* Copyright */}
            <p className="text-xs text-gray-400 dark:text-gray-500">
              &copy; 2026 DebateForge. Built with &#10084;&#65039; and AI.
            </p>

            {/* Tech note */}
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Made with Electron, React, and too many API calls
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingView;
