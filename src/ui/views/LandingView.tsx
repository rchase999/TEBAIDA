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
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  ArrowUp,
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
  Star,
  X,
  Monitor,
  Apple,
  Terminal,
  Search,
  CheckCircle,
  TrendingUp,
} from 'lucide-react';

// =============================================================================
// Props
// =============================================================================
interface LandingViewProps {
  onGetStarted: () => void;
  onExploreFeatures: () => void;
}

// =============================================================================
// Reduced motion check
// =============================================================================
function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// =============================================================================
// useInView -- scroll-triggered visibility with IntersectionObserver
// =============================================================================
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

// =============================================================================
// useCountUp -- animate a number from 0 to target with easeOutQuart
// =============================================================================
function useCountUp(target: number, active: boolean, duration = 1800): number {
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
      const eased = 1 - Math.pow(1 - progress, 4); // easeOutQuart
      setValue(Math.round(eased * target));
      if (progress < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, active, duration]);

  return value;
}

// =============================================================================
// useTypewriter -- cycles through words with typing/deleting animation
// =============================================================================
function useTypewriter(
  words: string[],
  typingSpeed = 90,
  deletingSpeed = 50,
  pauseDuration = 1800,
): { text: string; wordIndex: number; isDeleting: boolean } {
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
    wordIndex,
    isDeleting,
  };
}

// =============================================================================
// useParallax -- scroll-based parallax offset
// =============================================================================
function useParallax(speed = 0.3): number {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const container = document.getElementById('landing-scroll-container');
    if (!container) return;
    const handleScroll = () => {
      setOffset(container.scrollTop * speed);
    };
    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [speed]);

  return offset;
}

// =============================================================================
// useScrollProgress -- returns 0..1 of scroll progress for timeline
// =============================================================================
function useScrollProgress(ref: React.RefObject<HTMLElement | null>): number {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (prefersReducedMotion()) {
      setProgress(1);
      return;
    }
    const container = document.getElementById('landing-scroll-container');
    if (!container) return;
    const handleScroll = () => {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      const relativeTop = rect.top - containerRect.top;
      const viewH = containerRect.height;
      const elH = rect.height;
      const start = viewH * 0.8;
      const end = -elH * 0.2;
      const p = 1 - (relativeTop - end) / (start - end);
      setProgress(Math.max(0, Math.min(1, p)));
    };
    container.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => container.removeEventListener('scroll', handleScroll);
  }, [ref]);

  return progress;
}

// =============================================================================
// Inline CSS keyframes (injected once)
// =============================================================================
const LANDING_STYLES = `
@keyframes landingFloat {
  0% { transform: translateY(0px) translateX(0px); }
  33% { transform: translateY(-12px) translateX(6px); }
  66% { transform: translateY(6px) translateX(-8px); }
  100% { transform: translateY(0px) translateX(0px); }
}
@keyframes landingMeshDrift1 {
  0%, 100% { transform: translate(0%, 0%) scale(1); }
  25% { transform: translate(8%, -12%) scale(1.1); }
  50% { transform: translate(-5%, 8%) scale(0.95); }
  75% { transform: translate(12%, 5%) scale(1.05); }
}
@keyframes landingMeshDrift2 {
  0%, 100% { transform: translate(0%, 0%) scale(1); }
  25% { transform: translate(-10%, 8%) scale(1.08); }
  50% { transform: translate(6%, -10%) scale(0.92); }
  75% { transform: translate(-8%, -5%) scale(1.12); }
}
@keyframes landingMeshDrift3 {
  0%, 100% { transform: translate(0%, 0%) scale(1); }
  25% { transform: translate(5%, 10%) scale(1.15); }
  50% { transform: translate(-12%, -6%) scale(0.88); }
  75% { transform: translate(8%, -12%) scale(1.05); }
}
@keyframes landingGradientText {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
@keyframes landingShimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
@keyframes landingMarquee {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}
@keyframes landingPulseGlow {
  0%, 100% { box-shadow: 0 0 20px rgba(92, 124, 250, 0.3), 0 0 60px rgba(92, 124, 250, 0.1); }
  50% { box-shadow: 0 0 30px rgba(92, 124, 250, 0.5), 0 0 80px rgba(92, 124, 250, 0.2); }
}
@keyframes landingBounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(8px); }
}
@keyframes landingAurora {
  0%, 100% { opacity: 0.4; transform: translateX(-10%) rotate(0deg) scale(1); }
  25% { opacity: 0.6; transform: translateX(5%) rotate(1deg) scale(1.05); }
  50% { opacity: 0.3; transform: translateX(10%) rotate(-1deg) scale(0.95); }
  75% { opacity: 0.55; transform: translateX(-5%) rotate(0.5deg) scale(1.02); }
}
@keyframes landingConfetti {
  0% { transform: translateY(0) rotate(0deg); opacity: 1; }
  100% { transform: translateY(-100px) rotate(720deg); opacity: 0; }
}
@keyframes landingTypingDot {
  0%, 60%, 100% { opacity: 0.3; transform: translateY(0); }
  30% { opacity: 1; transform: translateY(-4px); }
}
@keyframes landingBubbleIn {
  0% { opacity: 0; transform: scale(0.8) translateY(10px); }
  100% { opacity: 1; transform: scale(1) translateY(0); }
}
@keyframes landingSparkline {
  0% { stroke-dashoffset: 200; }
  100% { stroke-dashoffset: 0; }
}
@keyframes landingLineGrow {
  0% { height: 0%; }
  100% { height: 100%; }
}
`;

// Inject styles once
let stylesInjected = false;
function injectStyles() {
  if (stylesInjected || typeof document === 'undefined') return;
  const style = document.createElement('style');
  style.textContent = LANDING_STYLES;
  document.head.appendChild(style);
  stylesInjected = true;
}

// =============================================================================
// Particles — floating dots with parallax awareness
// =============================================================================
const Particles: React.FC<{ count?: number; className?: string }> = React.memo(
  ({ count = 60, className }) => {
    const dots = useMemo(
      () =>
        Array.from({ length: count }, (_, i) => ({
          id: i,
          x: Math.random() * 100,
          y: Math.random() * 100,
          size: 1 + Math.random() * 2.5,
          duration: 18 + Math.random() * 30,
          delay: Math.random() * 15,
          opacity: 0.08 + Math.random() * 0.2,
        })),
      [count],
    );

    return (
      <div
        className={clsx('pointer-events-none absolute inset-0 overflow-hidden', className)}
        aria-hidden="true"
      >
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
                : `landingFloat ${d.duration}s ease-in-out ${d.delay}s infinite`,
            }}
          />
        ))}
      </div>
    );
  },
);
Particles.displayName = 'Particles';

// =============================================================================
// GradientMesh -- animated background for hero
// =============================================================================
const GradientMesh: React.FC = React.memo(() => (
  <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
    <div
      className="absolute rounded-full blur-[120px]"
      style={{
        width: '600px',
        height: '600px',
        top: '10%',
        left: '15%',
        background: 'rgba(92, 124, 250, 0.25)',
        animation: prefersReducedMotion() ? 'none' : 'landingMeshDrift1 20s ease-in-out infinite',
      }}
    />
    <div
      className="absolute rounded-full blur-[120px]"
      style={{
        width: '500px',
        height: '500px',
        top: '40%',
        right: '10%',
        background: 'rgba(139, 92, 246, 0.2)',
        animation: prefersReducedMotion() ? 'none' : 'landingMeshDrift2 25s ease-in-out infinite',
      }}
    />
    <div
      className="absolute rounded-full blur-[120px]"
      style={{
        width: '450px',
        height: '450px',
        bottom: '10%',
        left: '40%',
        background: 'rgba(34, 211, 238, 0.15)',
        animation: prefersReducedMotion() ? 'none' : 'landingMeshDrift3 22s ease-in-out infinite',
      }}
    />
  </div>
));
GradientMesh.displayName = 'GradientMesh';

// =============================================================================
// Section wrapper for consistent spacing
// =============================================================================
const Section = React.forwardRef<
  HTMLElement,
  { children: React.ReactNode; className?: string; id?: string }
>(({ children, className, id }, ref) => (
  <section
    id={id}
    ref={ref as React.Ref<HTMLElement>}
    className={clsx('relative w-full px-6 py-24 md:px-12 lg:px-20', className)}
  >
    <div className="mx-auto max-w-7xl">{children}</div>
  </section>
));
Section.displayName = 'Section';

// =============================================================================
// Section heading helper
// =============================================================================
const SectionHeading: React.FC<{
  title: string;
  subtitle?: string;
  visible: boolean;
}> = ({ title, subtitle, visible }) => (
  <div
    className={clsx(
      'mx-auto mb-16 max-w-3xl text-center transition-all duration-700',
      visible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0',
    )}
  >
    <h2 className="text-3xl font-bold text-white md:text-4xl lg:text-5xl">{title}</h2>
    {subtitle && <p className="mt-4 text-lg text-gray-400">{subtitle}</p>}
  </div>
);

// =============================================================================
// GlassCard
// =============================================================================
const GlassCard: React.FC<{
  children: React.ReactNode;
  className?: string;
  accentColor?: string;
  delay?: number;
  visible?: boolean;
}> = ({ children, className, accentColor, delay = 0, visible = true }) => (
  <div
    className={clsx(
      'group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-sm',
      'transition-all duration-500 hover:-translate-y-1 hover:border-white/[0.12] hover:bg-white/[0.06]',
      'hover:shadow-[0_0_40px_rgba(92,124,250,0.08)]',
      visible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0',
      className,
    )}
    style={{ transitionDelay: `${delay}ms` }}
  >
    {accentColor && (
      <div className="absolute inset-x-0 top-0 h-[2px]" style={{ background: accentColor }} />
    )}
    {children}
  </div>
);

// =============================================================================
// 1. ANNOUNCEMENT BAR
// =============================================================================
const AnnouncementBar: React.FC<{ onExploreFeatures: () => void }> = ({ onExploreFeatures }) => {
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem('landing-announce-dismissed') === '1';
    } catch {
      return false;
    }
  });

  const handleDismiss = useCallback(() => {
    setDismissed(true);
    try {
      localStorage.setItem('landing-announce-dismissed', '1');
    } catch {}
  }, []);

  if (dismissed) return null;

  return (
    <div className="relative z-50 flex items-center justify-center gap-3 overflow-hidden bg-gradient-to-r from-forge-600 via-purple-600 to-forge-600 px-4 py-2.5 text-sm text-white">
      {/* shimmer overlay */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.12) 50%, transparent 100%)',
          animation: prefersReducedMotion() ? 'none' : 'landingShimmer 3s linear infinite',
        }}
      />
      <span className="relative font-medium">
        <span className="mr-1.5">&#128293;</span>v2.0 is here &mdash; AI debates just got real
      </span>
      <button
        onClick={onExploreFeatures}
        className="relative inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-0.5 text-xs font-semibold transition-colors hover:bg-white/25"
      >
        See what&apos;s new <ArrowRight className="h-3 w-3" />
      </button>
      <button
        onClick={handleDismiss}
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
        aria-label="Dismiss announcement"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
};

// =============================================================================
// 2. HERO SECTION
// =============================================================================
const typewriterWords = [
  'Philosophy',
  'Politics',
  'Science',
  'Ethics',
  'Technology',
  'Law',
  'Economics',
];

const typewriterColors: Record<string, string> = {
  Philosophy: '#a78bfa',
  Politics: '#f87171',
  Science: '#34d399',
  Ethics: '#fbbf24',
  Technology: '#60a5fa',
  Law: '#f472b6',
  Economics: '#2dd4bf',
};

const HeroSection: React.FC<{
  onGetStarted: () => void;
  onExploreFeatures: () => void;
}> = ({ onGetStarted, onExploreFeatures }) => {
  const parallaxOffset = useParallax(0.25);
  const { text, wordIndex } = useTypewriter(typewriterWords, 85, 45, 1600);
  const currentWord = typewriterWords[wordIndex];

  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0a0b0f]">
      <GradientMesh />
      <Particles count={60} />

      <div
        className="relative z-10 flex flex-col items-center px-6 text-center"
        style={{
          transform: prefersReducedMotion() ? 'none' : `translateY(${parallaxOffset * 0.4}px)`,
        }}
      >
        {/* Trust badge */}
        <div
          className="mb-8 inline-flex items-center gap-2 rounded-full border border-forge-500/30 bg-forge-500/10 px-4 py-1.5 text-sm text-forge-300"
          style={{
            boxShadow: '0 0 20px rgba(92,124,250,0.15)',
          }}
        >
          <Sparkles className="h-3.5 w-3.5" />
          Trusted by 10,000+ debaters
        </div>

        {/* Main headline */}
        <h1 className="max-w-4xl font-black leading-[0.95] tracking-tight">
          <span className="block text-5xl text-white md:text-6xl lg:text-7xl xl:text-8xl">
            The Arena Where
          </span>
          <span
            className="mt-2 block bg-clip-text text-5xl text-transparent md:text-6xl lg:text-7xl xl:text-8xl"
            style={{
              backgroundImage: 'linear-gradient(90deg, #748ffc, #a78bfa, #22d3ee, #748ffc)',
              backgroundSize: '200% 100%',
              animation: prefersReducedMotion()
                ? 'none'
                : 'landingGradientText 4s ease infinite',
              WebkitBackgroundClip: 'text',
            }}
          >
            AI Minds Clash
          </span>
        </h1>

        {/* Typewriter */}
        <div className="mt-8 flex h-10 items-center justify-center text-2xl font-semibold md:text-3xl">
          <span style={{ color: typewriterColors[currentWord] || '#fff' }}>{text}</span>
          <span
            className="ml-0.5 inline-block h-8 w-[3px] rounded-full bg-white/70"
            style={{ animation: prefersReducedMotion() ? 'none' : 'blink 1s step-end infinite' }}
          />
        </div>

        {/* Subheadline */}
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-gray-400 md:text-xl">
          Pit Claude against GPT-4. Watch Gemini challenge Mistral. Analyze every argument, detect
          every fallacy, track every momentum shift &mdash; in real time.
        </p>

        {/* CTAs */}
        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
          <button
            onClick={onGetStarted}
            className="group inline-flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-forge-500 to-purple-600 px-8 py-4 text-lg font-bold text-white transition-transform duration-200 hover:scale-105"
            style={{
              animation: prefersReducedMotion() ? 'none' : 'landingPulseGlow 3s ease-in-out infinite',
            }}
          >
            Enter the Arena
            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </button>
          <button
            onClick={onExploreFeatures}
            className="inline-flex items-center gap-2.5 rounded-xl border border-white/15 bg-white/5 px-8 py-4 text-lg font-semibold text-white backdrop-blur transition-colors hover:bg-white/10"
          >
            <Play className="h-5 w-5" />
            Watch Demo
          </button>
        </div>

        {/* Trust line */}
        <p className="mt-6 flex items-center gap-3 text-sm text-gray-500">
          <span>No credit card required</span>
          <span className="h-1 w-1 rounded-full bg-gray-600" />
          <span>Free forever</span>
          <span className="h-1 w-1 rounded-full bg-gray-600" />
          <span>6 AI models</span>
        </p>

        {/* Scroll indicator */}
        <div
          className="mt-16 flex flex-col items-center gap-2 text-gray-500"
          style={{
            animation: prefersReducedMotion() ? 'none' : 'landingBounce 2s ease-in-out infinite',
          }}
        >
          <span className="text-xs uppercase tracking-widest">Scroll to explore</span>
          <ChevronDown className="h-5 w-5" />
        </div>
      </div>
    </section>
  );
};

// =============================================================================
// 3. LOGO TRUST BAR
// =============================================================================
const AI_PROVIDERS = [
  { name: 'Anthropic', sub: 'Claude', color: '#d4a574' },
  { name: 'OpenAI', sub: 'GPT-4', color: '#10a37f' },
  { name: 'Google', sub: 'Gemini', color: '#4285f4' },
  { name: 'Mistral', sub: 'Mistral', color: '#ff7000' },
  { name: 'Groq', sub: 'Groq', color: '#f55036' },
  { name: 'Ollama', sub: 'Local', color: '#ffffff' },
];

const LogoTrustBar: React.FC = () => {
  const [ref, visible] = useInView(0.1);

  return (
    <Section className="overflow-hidden bg-[#0d0e13] py-16" ref={ref}>
      <p
        className={clsx(
          'mb-10 text-center text-sm font-medium uppercase tracking-[0.2em] text-gray-500 transition-all duration-700',
          visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
        )}
      >
        Powered by the world&apos;s leading AI
      </p>

      <div className="relative">
        {/* fade edges */}
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-[#0d0e13] to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-[#0d0e13] to-transparent" />

        <div
          className="flex overflow-hidden"
          style={{
            maskImage:
              'linear-gradient(to right, transparent, black 10%, black 90%, transparent)',
            WebkitMaskImage:
              'linear-gradient(to right, transparent, black 10%, black 90%, transparent)',
          }}
        >
          <div
            className="flex shrink-0 gap-6"
            style={{
              animation: prefersReducedMotion()
                ? 'none'
                : 'landingMarquee 30s linear infinite',
            }}
          >
            {[...AI_PROVIDERS, ...AI_PROVIDERS].map((p, i) => (
              <div
                key={`${p.name}-${i}`}
                className="group flex shrink-0 items-center gap-3 rounded-full border border-white/[0.06] bg-white/[0.03] px-6 py-3 transition-all duration-300 hover:border-white/[0.15] hover:bg-white/[0.06]"
              >
                <div
                  className="h-3 w-3 rounded-full transition-all duration-300"
                  style={{
                    backgroundColor: p.color,
                    filter: 'grayscale(100%)',
                  }}
                  onMouseEnter={(e) => {
                    (e.target as HTMLDivElement).style.filter = 'grayscale(0%)';
                  }}
                  onMouseLeave={(e) => {
                    (e.target as HTMLDivElement).style.filter = 'grayscale(100%)';
                  }}
                />
                <span className="text-sm font-semibold text-gray-400 transition-colors group-hover:text-white">
                  {p.name}
                </span>
                <span className="text-xs text-gray-600">{p.sub}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Section>
  );
};

// =============================================================================
// 4. FEATURES BENTO GRID
// =============================================================================
interface FeatureCardData {
  icon: React.FC<{ className?: string; style?: React.CSSProperties }>;
  title: string;
  description: string;
  accent: string;
  size: 'large' | 'medium' | 'small';
}

const FEATURES: FeatureCardData[] = [
  {
    icon: Swords,
    title: 'Multi-Model Arena',
    description:
      'Pit any combination of AI models against each other in structured debates. Watch Claude challenge GPT-4, or Gemini take on Mistral in real-time intellectual combat.',
    accent: 'linear-gradient(90deg, #748ffc, #a78bfa)',
    size: 'large',
  },
  {
    icon: Crown,
    title: 'Oxford Union Format',
    description: 'Authentic debate formats including Oxford, Lincoln-Douglas, and Parliamentary styles with proper turn structure.',
    accent: '#fbbf24',
    size: 'medium',
  },
  {
    icon: Users,
    title: 'Custom Personas',
    description: 'Create debaters with unique expertise, rhetorical styles, and personality traits for nuanced arguments.',
    accent: '#a78bfa',
    size: 'medium',
  },
  {
    icon: Trophy,
    title: 'ELO Rankings',
    description: 'Track model performance over time with a competitive ELO rating system across categories and formats.',
    accent: '#f59e0b',
    size: 'medium',
  },
  {
    icon: AlertTriangle,
    title: 'Fallacy Detection',
    description: 'Real-time identification of 20+ logical fallacies.',
    accent: '#ef4444',
    size: 'small',
  },
  {
    icon: ShieldCheck,
    title: 'Evidence Verification',
    description: 'Automatic fact-checking and source evaluation.',
    accent: '#10b981',
    size: 'small',
  },
  {
    icon: BarChart3,
    title: 'Momentum Tracking',
    description: 'Live scoring and argument momentum analysis.',
    accent: '#3b82f6',
    size: 'small',
  },
  {
    icon: Target,
    title: 'Tournament Mode',
    description: 'Run multi-round elimination tournaments.',
    accent: '#f97316',
    size: 'small',
  },
  {
    icon: Share2,
    title: 'Export & Share',
    description: 'PDF reports, JSON data, and shareable links.',
    accent: '#06b6d4',
    size: 'small',
  },
];

const ArenaAnimation: React.FC = React.memo(() => (
  <div className="relative mt-4 flex items-center justify-center gap-4">
    {/* Blue bubble */}
    <div
      className="rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-sm text-blue-300"
      style={{
        animation: prefersReducedMotion() ? 'none' : 'float 4s ease-in-out infinite',
      }}
    >
      Claude argues...
    </div>
    {/* Lightning */}
    <Zap
      className="h-6 w-6 text-yellow-400"
      style={{
        animation: prefersReducedMotion() ? 'none' : 'pulseSoft 2s ease-in-out infinite',
      }}
    />
    {/* Red bubble */}
    <div
      className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-300"
      style={{
        animation: prefersReducedMotion()
          ? 'none'
          : 'float 4s ease-in-out 1s infinite',
      }}
    >
      GPT-4 rebuts...
    </div>
  </div>
));
ArenaAnimation.displayName = 'ArenaAnimation';

const FeaturesGrid: React.FC = () => {
  const [ref, visible] = useInView(0.05);

  return (
    <Section className="bg-[#0a0b0f]" ref={ref} id="features">
      <SectionHeading
        title="Everything you need to run the ultimate AI showdown"
        subtitle="From setup to analysis, DebateForge handles every aspect of structured AI debates."
        visible={visible}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Large card - spans 2x2 */}
        <GlassCard
          className="p-8 md:col-span-2 md:row-span-2"
          accentColor={FEATURES[0].accent}
          delay={0}
          visible={visible}
        >
          <div className="flex h-full flex-col">
            {(() => { const Icon = FEATURES[0].icon; return (
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-forge-500/15 text-forge-400">
              <Icon className="h-6 w-6" />
            </div>
            ); })()}
            <h3 className="text-2xl font-bold text-white">{FEATURES[0].title}</h3>
            <p className="mt-3 text-gray-400 leading-relaxed">{FEATURES[0].description}</p>
            <ArenaAnimation />
          </div>
        </GlassCard>

        {/* 3 Medium cards */}
        {FEATURES.slice(1, 4).map((f, i) => {
          const Icon = f.icon;
          return (
          <GlassCard
            key={f.title}
            className="p-6"
            accentColor={f.accent}
            delay={(i + 1) * 80}
            visible={visible}
          >
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-white/[0.06]">
              <Icon className="h-5 w-5" style={{ color: f.accent }} />
            </div>
            <h3 className="text-lg font-bold text-white">{f.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-gray-400">{f.description}</p>
          </GlassCard>
          );
        })}

        {/* 5 Small cards in a row spanning full width */}
        {FEATURES.slice(4).map((f, i) => {
          const Icon = f.icon;
          return (
          <GlassCard
            key={f.title}
            className="p-5 lg:col-span-1"
            accentColor={f.accent}
            delay={(i + 4) * 80}
            visible={visible}
          >
            <div className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.06]">
              <Icon className="h-4 w-4" style={{ color: f.accent }} />
            </div>
            <h3 className="text-sm font-bold text-white">{f.title}</h3>
            <p className="mt-1 text-xs leading-relaxed text-gray-500">{f.description}</p>
          </GlassCard>
          );
        })}
      </div>
    </Section>
  );
};

// =============================================================================
// 5. HOW IT WORKS -- CINEMATIC TIMELINE
// =============================================================================
interface TimelineStep {
  icon: React.FC<{ className?: string }>;
  title: string;
  description: string;
  mockup: React.ReactNode;
}

const TopicPickerMockup: React.FC = () => (
  <div className="mt-3 rounded-lg border border-white/[0.06] bg-white/[0.03] p-3 text-xs">
    <div className="mb-2 flex items-center gap-2 text-gray-400">
      <Search className="h-3 w-3" />
      <span>Search topics...</span>
    </div>
    <div className="space-y-1.5">
      {['Should AI have rights?', 'Universal Basic Income', 'Space Colonization'].map((t) => (
        <div key={t} className="rounded-md bg-white/[0.04] px-2 py-1.5 text-gray-300 transition-colors hover:bg-forge-500/10">
          {t}
        </div>
      ))}
    </div>
  </div>
);

const DebaterSelectMockup: React.FC = () => (
  <div className="mt-3 flex gap-2">
    <div className="flex-1 rounded-lg border border-blue-500/20 bg-blue-500/5 p-2 text-center text-xs">
      <div className="mb-1 text-blue-400 font-semibold">PRO</div>
      <div className="text-gray-300">Claude Sonnet</div>
    </div>
    <div className="flex items-center text-gray-600">
      <Swords className="h-4 w-4" />
    </div>
    <div className="flex-1 rounded-lg border border-red-500/20 bg-red-500/5 p-2 text-center text-xs">
      <div className="mb-1 text-red-400 font-semibold">CON</div>
      <div className="text-gray-300">GPT-4o</div>
    </div>
  </div>
);

const LiveBattleMockup: React.FC = () => (
  <div className="mt-3 space-y-2">
    <div className="rounded-lg bg-blue-500/5 border border-blue-500/10 p-2 text-xs text-gray-300">
      <span className="text-blue-400 font-semibold">Claude: </span>
      The evidence suggests...
    </div>
    <div className="rounded-lg bg-red-500/5 border border-red-500/10 p-2 text-xs text-gray-300">
      <span className="text-red-400 font-semibold">GPT-4o: </span>
      <span className="inline-flex gap-0.5">
        {[0, 1, 2].map((d) => (
          <span
            key={d}
            className="inline-block h-1.5 w-1.5 rounded-full bg-gray-400"
            style={{
              animation: prefersReducedMotion()
                ? 'none'
                : `landingTypingDot 1.2s ease-in-out ${d * 0.2}s infinite`,
            }}
          />
        ))}
      </span>
    </div>
  </div>
);

const ChartMockup: React.FC = () => (
  <div className="mt-3 flex items-end gap-1 h-12">
    {[40, 65, 55, 80, 70, 90, 85].map((h, i) => (
      <div
        key={i}
        className="flex-1 rounded-t bg-gradient-to-t from-forge-600 to-purple-500 transition-all"
        style={{ height: `${h}%`, opacity: 0.5 + (i / 14) }}
      />
    ))}
  </div>
);

const TIMELINE_STEPS: TimelineStep[] = [
  {
    icon: Lightbulb,
    title: 'Choose Your Topic',
    description:
      'Pick from thousands of topics or create your own. Our AI suggests the most debatable ones.',
    mockup: <TopicPickerMockup />,
  },
  {
    icon: Swords,
    title: 'Assemble Your Fighters',
    description:
      'Select AI models, assign personas, set the rules. Mix and match for unique matchups.',
    mockup: <DebaterSelectMockup />,
  },
  {
    icon: Zap,
    title: 'Watch the Battle',
    description:
      'Real-time streaming responses, live momentum tracking, and fallacy detection as it happens.',
    mockup: <LiveBattleMockup />,
  },
  {
    icon: BarChart3,
    title: 'Analyze the Results',
    description:
      'Detailed scorecards, evidence analysis, argument maps, and exportable reports.',
    mockup: <ChartMockup />,
  },
];

const TimelineSection: React.FC = () => {
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const [headingRef, headingVisible] = useInView(0.2);
  const scrollProgress = useScrollProgress(sectionRef);

  return (
    <Section className="bg-[#0d0e13]" id="how-it-works">
      <div ref={headingRef}>
        <SectionHeading
          title="Four steps to your first AI clash"
          subtitle=""
          visible={headingVisible}
        />
      </div>

      <div ref={sectionRef} className="relative">
        {/* Glowing timeline line */}
        <div className="absolute left-1/2 top-0 hidden h-full w-px -translate-x-1/2 md:block">
          <div className="h-full w-full bg-white/[0.06]" />
          <div
            className="absolute top-0 left-0 w-full bg-gradient-to-b from-forge-500 to-purple-500"
            style={{
              height: `${scrollProgress * 100}%`,
              boxShadow: '0 0 12px rgba(92,124,250,0.5)',
              transition: 'height 0.1s linear',
            }}
          />
        </div>

        <div className="space-y-16 md:space-y-24">
          {TIMELINE_STEPS.map((step, i) => {
            const isLeft = i % 2 === 0;
            return (
              <TimelineStepCard key={step.title} step={step} index={i} isLeft={isLeft} />
            );
          })}
        </div>
      </div>
    </Section>
  );
};

const TimelineStepCard: React.FC<{
  step: TimelineStep;
  index: number;
  isLeft: boolean;
}> = ({ step, index, isLeft }) => {
  const [ref, visible] = useInView(0.2);
  const StepIcon = step.icon;

  return (
    <div ref={ref} className="relative grid grid-cols-1 items-center gap-8 md:grid-cols-2">
      {/* Step number dot on timeline */}
      <div className="absolute left-1/2 top-0 z-10 hidden -translate-x-1/2 md:flex">
        <div
          className={clsx(
            'flex h-10 w-10 items-center justify-center rounded-full border-2 border-forge-500 bg-[#0d0e13] text-sm font-bold text-forge-400 transition-all duration-500',
            visible ? 'scale-100 opacity-100' : 'scale-50 opacity-0',
          )}
        >
          {index + 1}
        </div>
      </div>

      {/* Content */}
      <div
        className={clsx(
          'transition-all duration-700',
          isLeft ? 'md:text-right md:pr-16' : 'md:order-2 md:pl-16',
          visible
            ? 'translate-x-0 opacity-100'
            : isLeft
              ? '-translate-x-12 opacity-0'
              : 'translate-x-12 opacity-0',
        )}
      >
        <div className={clsx('inline-flex items-center gap-3', isLeft && 'md:flex-row-reverse')}>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-forge-500/15 text-forge-400">
            <StepIcon className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-bold text-white">{step.title}</h3>
        </div>
        <p className="mt-3 text-gray-400">{step.description}</p>
      </div>

      {/* Mockup */}
      <div
        className={clsx(
          'transition-all duration-700 delay-200',
          isLeft ? 'md:pl-16' : 'md:order-1 md:pr-16',
          visible
            ? 'translate-x-0 opacity-100'
            : isLeft
              ? 'translate-x-12 opacity-0'
              : '-translate-x-12 opacity-0',
        )}
      >
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4">
          {step.mockup}
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// 6. LIVE DEMO SHOWCASE
// =============================================================================
const LiveDemoSection: React.FC = () => {
  const [ref, visible] = useInView(0.1);
  const [badges, setBadges] = useState<boolean[]>([false, false, false]);

  useEffect(() => {
    if (!visible || prefersReducedMotion()) {
      if (visible) setBadges([true, true, true]);
      return;
    }
    const timers = [
      setTimeout(() => setBadges((b) => [true, b[1], b[2]]), 1500),
      setTimeout(() => setBadges((b) => [b[0], true, b[2]]), 3000),
      setTimeout(() => setBadges((b) => [b[0], b[1], true]), 4500),
    ];
    return () => timers.forEach(clearTimeout);
  }, [visible]);

  return (
    <Section className="bg-[#0a0b0f]" ref={ref} id="demo">
      <SectionHeading title="See it in action" subtitle="" visible={visible} />

      <div
        className={clsx(
          'mx-auto max-w-4xl transition-all duration-1000',
          visible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0',
        )}
        style={{
          transform: visible
            ? 'perspective(1200px) rotateX(2deg)'
            : 'perspective(1200px) rotateX(8deg) translateY(48px)',
          transition: 'transform 1s ease-out, opacity 1s ease-out',
        }}
      >
        {/* Browser chrome */}
        <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#12131a] shadow-[0_20px_80px_rgba(92,124,250,0.12)]">
          {/* Title bar */}
          <div className="flex items-center gap-3 border-b border-white/[0.06] bg-[#16171f] px-4 py-3">
            <div className="flex gap-1.5">
              <div className="h-3 w-3 rounded-full bg-red-500/70" />
              <div className="h-3 w-3 rounded-full bg-yellow-500/70" />
              <div className="h-3 w-3 rounded-full bg-green-500/70" />
            </div>
            <div className="ml-4 flex-1 rounded-md bg-white/[0.05] px-3 py-1 text-center text-xs text-gray-500">
              DebateForge &mdash; Live Debate
            </div>
          </div>

          {/* Topic bar */}
          <div className="border-b border-white/[0.06] bg-forge-500/5 px-6 py-3 text-center text-sm font-medium text-gray-300">
            <span className="text-gray-500">Topic: </span>
            Should artificial intelligence be granted legal personhood?
          </div>

          {/* Debate content */}
          <div className="grid grid-cols-2 gap-0 divide-x divide-white/[0.06] p-0">
            {/* Claude side */}
            <div className="p-5">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-400">
                <div className="h-2 w-2 rounded-full bg-blue-400" />
                Claude Sonnet 4
              </div>
              <div className="rounded-lg bg-blue-500/5 border border-blue-500/10 p-3 text-sm leading-relaxed text-gray-300">
                Granting AI legal personhood establishes a framework for accountability. When an autonomous system causes harm, legal personhood provides a clear entity against which claims can be directed, rather than diffusing responsibility across developers, operators, and users.
              </div>
            </div>

            {/* GPT-4o side */}
            <div className="p-5">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-400">
                <div className="h-2 w-2 rounded-full bg-red-400" />
                GPT-4o
              </div>
              <div className="rounded-lg bg-red-500/5 border border-red-500/10 p-3 text-sm leading-relaxed text-gray-300">
                <span>Legal personhood implies moral standing, which requires consciousness and subjective experience. Att</span>
                <span className="inline-flex items-center gap-0.5 ml-0.5">
                  {[0, 1, 2].map((d) => (
                    <span
                      key={d}
                      className="inline-block h-1.5 w-1.5 rounded-full bg-gray-400"
                      style={{
                        animation: prefersReducedMotion()
                          ? 'none'
                          : `landingTypingDot 1.2s ease-in-out ${d * 0.2}s infinite`,
                      }}
                    />
                  ))}
                </span>
              </div>
            </div>
          </div>

          {/* Momentum bar */}
          <div className="border-t border-white/[0.06] p-4">
            <div className="mb-1.5 flex justify-between text-xs text-gray-500">
              <span>Claude: 54%</span>
              <span>Momentum</span>
              <span>GPT-4o: 46%</span>
            </div>
            <div className="flex h-2 overflow-hidden rounded-full bg-white/[0.06]">
              <div className="rounded-l-full bg-gradient-to-r from-blue-500 to-blue-400" style={{ width: '54%' }} />
              <div className="rounded-r-full bg-gradient-to-r from-red-400 to-red-500" style={{ width: '46%' }} />
            </div>
          </div>
        </div>

        {/* Floating badges */}
        <div className="pointer-events-none relative">
          {[
            { text: '\uD83D\uDD0D Fallacy Detected', x: '-5%', y: '-120px', color: 'border-red-500/30 bg-red-500/10 text-red-300' },
            { text: '\uD83D\uDCCA Momentum Shift', x: '75%', y: '-200px', color: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-300' },
            { text: '\u2705 Evidence Verified', x: '85%', y: '-80px', color: 'border-green-500/30 bg-green-500/10 text-green-300' },
          ].map((badge, i) => (
            <div
              key={badge.text}
              className={clsx(
                'absolute rounded-full border px-3 py-1.5 text-xs font-medium shadow-lg transition-all duration-500',
                badge.color,
                badges[i] ? 'scale-100 opacity-100' : 'scale-75 opacity-0',
              )}
              style={{ left: badge.x, top: badge.y }}
            >
              {badge.text}
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
};

// =============================================================================
// 7. TESTIMONIALS CAROUSEL
// =============================================================================
interface Testimonial {
  quote: string;
  name: string;
  title: string;
  company: string;
  initials: string;
  color: string;
}

const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      'DebateForge is the closest thing to watching real Oxford debates -- except the debaters are AI and they never run out of arguments.',
    name: 'Sarah Chen',
    title: 'AI Researcher',
    company: 'Stanford',
    initials: 'SC',
    color: '#a78bfa',
  },
  {
    quote:
      'I use this in my classroom every week. Students are fascinated watching Claude and GPT-4 argue about Kant vs Mill.',
    name: 'Dr. Marcus Webb',
    title: 'Philosophy Professor',
    company: 'MIT',
    initials: 'MW',
    color: '#60a5fa',
  },
  {
    quote:
      'The fallacy detection feature alone saved my research team hundreds of hours of manual analysis.',
    name: 'Alex Rivera',
    title: 'Tech Journalist',
    company: 'The Verge',
    initials: 'AR',
    color: '#f87171',
  },
  {
    quote:
      'We tested 4 different LLMs on policy debates. DebateForge\'s ELO system gave us publishable comparative data.',
    name: 'Dr. Priya Sharma',
    title: 'Computational Linguistics',
    company: 'Oxford',
    initials: 'PS',
    color: '#34d399',
  },
  {
    quote:
      'My 12-year-old son uses it to learn about critical thinking. The UI is so intuitive even kids can follow along.',
    name: 'James O\'Brien',
    title: 'Parent & Educator',
    company: '',
    initials: 'JO',
    color: '#fbbf24',
  },
  {
    quote:
      'This is what happens when you give AI a proper stage. Absolute game-changer for model evaluation.',
    name: 'Kai Nakamura',
    title: 'ML Engineer',
    company: 'DeepMind',
    initials: 'KN',
    color: '#2dd4bf',
  },
];

const TestimonialsSection: React.FC = () => {
  const [ref, visible] = useInView(0.1);
  const [activeIndex, setActiveIndex] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startAutoSlide = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setActiveIndex((p) => (p + 1) % TESTIMONIALS.length);
    }, 5000);
  }, []);

  useEffect(() => {
    if (visible) startAutoSlide();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [visible, startAutoSlide]);

  const goTo = useCallback(
    (dir: -1 | 1) => {
      setActiveIndex((p) => (p + dir + TESTIMONIALS.length) % TESTIMONIALS.length);
      startAutoSlide();
    },
    [startAutoSlide],
  );

  // Show 3 cards centered on activeIndex
  const getVisibleIndices = () => {
    const len = TESTIMONIALS.length;
    return [
      (activeIndex - 1 + len) % len,
      activeIndex,
      (activeIndex + 1) % len,
    ];
  };

  const visibleIndices = getVisibleIndices();

  return (
    <Section className="overflow-hidden bg-[#0d0e13]" ref={ref} id="testimonials">
      <SectionHeading
        title="What debaters are saying"
        subtitle=""
        visible={visible}
      />

      <div className="relative">
        {/* Navigation arrows */}
        <button
          onClick={() => goTo(-1)}
          className="absolute -left-2 top-1/2 z-20 -translate-y-1/2 rounded-full border border-white/10 bg-white/5 p-2 text-gray-400 backdrop-blur transition-colors hover:bg-white/10 hover:text-white"
          aria-label="Previous testimonial"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          onClick={() => goTo(1)}
          className="absolute -right-2 top-1/2 z-20 -translate-y-1/2 rounded-full border border-white/10 bg-white/5 p-2 text-gray-400 backdrop-blur transition-colors hover:bg-white/10 hover:text-white"
          aria-label="Next testimonial"
        >
          <ChevronRight className="h-5 w-5" />
        </button>

        <div className="flex items-stretch justify-center gap-4 px-8">
          {visibleIndices.map((idx, pos) => {
            const t = TESTIMONIALS[idx];
            const isCenter = pos === 1;
            return (
              <div
                key={`${t.name}-${idx}`}
                className={clsx(
                  'hidden w-full max-w-sm shrink-0 rounded-2xl border p-6 transition-all duration-500 md:block',
                  isCenter
                    ? 'scale-105 border-forge-500/20 bg-white/[0.06] shadow-[0_0_40px_rgba(92,124,250,0.1)]'
                    : 'scale-95 border-white/[0.06] bg-white/[0.03] opacity-60',
                )}
              >
                {/* Stars */}
                <div className="mb-4 flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, si) => (
                    <Star key={si} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>

                <Quote className="mb-2 h-6 w-6 text-white/10" />
                <p className="text-sm leading-relaxed text-gray-300">{t.quote}</p>

                <div className="mt-6 flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white"
                    style={{ backgroundColor: t.color }}
                  >
                    {t.initials}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">{t.name}</div>
                    <div className="text-xs text-gray-500">
                      {t.title}
                      {t.company && `, ${t.company}`}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Mobile: show only center card */}
          <div className="w-full max-w-sm rounded-2xl border border-forge-500/20 bg-white/[0.06] p-6 md:hidden">
            <div className="mb-4 flex gap-0.5">
              {Array.from({ length: 5 }).map((_, si) => (
                <Star key={si} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <Quote className="mb-2 h-6 w-6 text-white/10" />
            <p className="text-sm leading-relaxed text-gray-300">
              {TESTIMONIALS[activeIndex].quote}
            </p>
            <div className="mt-6 flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white"
                style={{ backgroundColor: TESTIMONIALS[activeIndex].color }}
              >
                {TESTIMONIALS[activeIndex].initials}
              </div>
              <div>
                <div className="text-sm font-semibold text-white">
                  {TESTIMONIALS[activeIndex].name}
                </div>
                <div className="text-xs text-gray-500">
                  {TESTIMONIALS[activeIndex].title}
                  {TESTIMONIALS[activeIndex].company &&
                    `, ${TESTIMONIALS[activeIndex].company}`}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dot indicators */}
        <div className="mt-8 flex justify-center gap-2">
          {TESTIMONIALS.map((_, i) => (
            <button
              key={i}
              onClick={() => {
                setActiveIndex(i);
                startAutoSlide();
              }}
              className={clsx(
                'h-2 rounded-full transition-all duration-300',
                i === activeIndex ? 'w-6 bg-forge-500' : 'w-2 bg-white/20',
              )}
              aria-label={`Go to testimonial ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </Section>
  );
};

// =============================================================================
// 8. STATS SECTION
// =============================================================================
interface StatItem {
  value: number;
  suffix: string;
  label: string;
  icon: React.FC<{ className?: string }>;
}

const STATS: StatItem[] = [
  { value: 6, suffix: '+', label: 'AI Models Supported', icon: Sparkles },
  { value: 10000, suffix: '+', label: 'Debates Completed', icon: Swords },
  { value: 50000, suffix: '+', label: 'Fallacies Detected', icon: AlertTriangle },
  { value: 99, suffix: '.9%', label: 'Uptime', icon: Shield },
];

const Sparkline: React.FC<{ active: boolean }> = ({ active }) => {
  const points = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => {
        const y = 20 - Math.random() * 15 - (i / 12) * 5;
        return `${(i / 11) * 80 + 10},${y}`;
      }).join(' '),
    [],
  );

  return (
    <svg viewBox="0 0 100 30" className="mt-2 h-8 w-full" preserveAspectRatio="none">
      <polyline
        points={points}
        fill="none"
        stroke="rgba(92,124,250,0.4)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
          strokeDasharray: 200,
          strokeDashoffset: active ? 0 : 200,
          transition: 'stroke-dashoffset 2s ease-out',
        }}
      />
    </svg>
  );
};

const StatCard: React.FC<{
  stat: StatItem;
  index: number;
  visible: boolean;
}> = ({ stat, index, visible }) => {
  const count = useCountUp(stat.value, visible, 1800 + index * 200);
  const Icon = stat.icon;

  return (
    <div
      className={clsx(
        'text-center transition-all duration-700',
        visible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0',
      )}
      style={{ transitionDelay: `${index * 150}ms` }}
    >
      <Icon className="mx-auto mb-3 h-6 w-6 text-forge-400" />
      <div className="text-4xl font-black text-white md:text-5xl">
        {stat.value >= 1000
          ? `${Math.floor(count / 1000).toLocaleString()},${String(count % 1000).padStart(3, '0')}`
          : count}
        <span className="text-forge-400">{stat.suffix}</span>
      </div>
      <div className="mt-1 text-sm text-gray-500">{stat.label}</div>
      <Sparkline active={visible} />
    </div>
  );
};

const StatsSection: React.FC = () => {
  const [ref, visible] = useInView(0.2);

  return (
    <Section
      className="bg-[#0a0b0f]"
      ref={ref}
      id="stats"
    >
      {/* Subtle grid pattern */}
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      <div className="relative grid grid-cols-2 gap-6 md:grid-cols-4">
        {STATS.map((stat, i) => (
          <StatCard key={stat.label} stat={stat} index={i} visible={visible} />
        ))}
      </div>
    </Section>
  );
};

// =============================================================================
// 9. FAQ ACCORDION
// =============================================================================
interface FAQItem {
  question: string;
  answer: string;
}

const FAQ_DATA: FAQItem[] = [
  {
    question: 'What is DebateForge?',
    answer:
      'DebateForge is a desktop application that lets you orchestrate structured debates between different AI language models. Watch Claude, GPT-4, Gemini, and other models argue both sides of any topic with real-time analysis.',
  },
  {
    question: 'Which AI models are supported?',
    answer:
      'Claude (Anthropic), GPT-4o (OpenAI), Gemini (Google), Mistral, Groq, plus local models via Ollama and LM Studio. We regularly add support for new models as they become available.',
  },
  {
    question: 'Is it free?',
    answer:
      'Yes! DebateForge is completely free and open-source under the MIT license. You only pay for the API usage from the AI providers you choose to use. Many providers offer free tiers.',
  },
  {
    question: 'Do I need API keys?',
    answer:
      'Yes, you will need at least one API key from a supported provider. The app guides you through the setup process. You can also use completely free local models through Ollama.',
  },
  {
    question: 'What debate formats are available?',
    answer:
      'Oxford Union (10 turns with opening, rebuttal, and closing), Lincoln-Douglas (8 turns focused on values), and Parliamentary (8 turns with points of order). Each format has authentic structure and rules.',
  },
  {
    question: 'How does fallacy detection work?',
    answer:
      'Our engine uses 20+ pattern-matching algorithms to identify logical fallacies in real-time as arguments are generated. Each detected fallacy is categorized, explained, and linked to the specific claim.',
  },
  {
    question: 'Can I create custom personas?',
    answer:
      'Absolutely! Create debaters with unique expertise areas, rhetorical styles, and personality traits. A legal expert persona will argue differently than a philosopher, producing more nuanced and realistic debates.',
  },
  {
    question: 'Is my data private?',
    answer:
      '100%. All data stays on your device. DebateForge never sends your debates, API keys, or any personal information to our servers. Your conversations go directly to the AI providers you configure.',
  },
  {
    question: 'What platforms are supported?',
    answer:
      'Windows, macOS, and Linux are all fully supported. DebateForge is built with Electron, ensuring a native experience across all major desktop operating systems.',
  },
  {
    question: 'How do I report bugs or request features?',
    answer:
      'Visit our GitHub issues page to report bugs or request features. We also have an active Discord community where you can discuss ideas and get help from other users.',
  },
];

const FAQAccordionItem: React.FC<{
  item: FAQItem;
  isOpen: boolean;
  onToggle: () => void;
  delay: number;
  visible: boolean;
}> = ({ item, isOpen, onToggle, delay, visible }) => (
  <div
    className={clsx(
      'border-b border-white/[0.06] transition-all duration-500',
      visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
    )}
    style={{ transitionDelay: `${delay}ms` }}
  >
    <button
      onClick={onToggle}
      className="flex w-full items-center justify-between py-5 text-left transition-colors hover:text-forge-400"
    >
      <span className="pr-4 text-base font-semibold text-white">{item.question}</span>
      <ChevronDown
        className={clsx(
          'h-5 w-5 shrink-0 text-gray-500 transition-transform duration-300',
          isOpen && 'rotate-180',
        )}
      />
    </button>
    <div
      className={clsx(
        'overflow-hidden transition-all duration-300',
        isOpen ? 'max-h-48 pb-5 opacity-100' : 'max-h-0 opacity-0',
      )}
    >
      <p className="text-sm leading-relaxed text-gray-400">{item.answer}</p>
    </div>
  </div>
);

const FAQSection: React.FC = () => {
  const [ref, visible] = useInView(0.05);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <Section className="bg-[#0d0e13]" ref={ref} id="faq">
      <SectionHeading
        title="Frequently asked questions"
        subtitle=""
        visible={visible}
      />

      <div className="mx-auto max-w-3xl">
        {FAQ_DATA.map((item, i) => (
          <FAQAccordionItem
            key={item.question}
            item={item}
            isOpen={openIndex === i}
            onToggle={() => setOpenIndex(openIndex === i ? null : i)}
            delay={i * 50}
            visible={visible}
          />
        ))}
      </div>
    </Section>
  );
};

// =============================================================================
// 10. FINAL CTA -- CINEMATIC
// =============================================================================
const FinalCTA: React.FC<{ onGetStarted: () => void }> = ({ onGetStarted }) => {
  const [ref, visible] = useInView(0.15);

  const confettiParticles = useMemo(
    () =>
      Array.from({ length: 30 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: 3 + Math.random() * 4,
        color: ['#748ffc', '#a78bfa', '#22d3ee', '#f59e0b', '#10b981', '#f87171'][
          Math.floor(Math.random() * 6)
        ],
        duration: 10 + Math.random() * 15,
        delay: Math.random() * 10,
      })),
    [],
  );

  return (
    <Section className="relative overflow-hidden bg-[#0a0b0f] py-32" ref={ref} id="cta">
      {/* Aurora background */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div
          className="absolute -left-1/4 top-0 h-full w-[150%] rounded-full blur-[100px]"
          style={{
            background:
              'linear-gradient(90deg, rgba(92,124,250,0.15), rgba(139,92,246,0.15), rgba(34,211,238,0.1))',
            animation: prefersReducedMotion() ? 'none' : 'landingAurora 12s ease-in-out infinite',
          }}
        />
      </div>

      {/* Confetti particles */}
      {confettiParticles.map((p) => (
        <div
          key={p.id}
          className="pointer-events-none absolute rounded-full"
          aria-hidden="true"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            opacity: 0.3,
            animation: prefersReducedMotion()
              ? 'none'
              : `landingFloat ${p.duration}s ease-in-out ${p.delay}s infinite`,
          }}
        />
      ))}

      <div
        className={clsx(
          'relative z-10 text-center transition-all duration-700',
          visible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0',
        )}
      >
        <h2 className="mx-auto max-w-3xl text-3xl font-bold text-white md:text-4xl lg:text-5xl">
          Ready to witness the ultimate AI showdown?
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-lg text-gray-400">
          Download DebateForge and start your first debate in under 30 seconds.
        </p>

        <button
          onClick={onGetStarted}
          className="group mt-10 inline-flex items-center gap-3 rounded-2xl bg-gradient-to-r from-forge-500 via-purple-500 to-forge-600 px-12 py-5 text-xl font-bold text-white transition-transform duration-200 hover:scale-105"
          style={{
            boxShadow:
              '0 0 40px rgba(92,124,250,0.3), 0 0 80px rgba(92,124,250,0.1)',
            animation: prefersReducedMotion() ? 'none' : 'landingPulseGlow 3s ease-in-out infinite',
          }}
        >
          Get Started Free
          <ArrowRight className="h-6 w-6 transition-transform group-hover:translate-x-1" />
        </button>

        <div className="mt-8 flex items-center justify-center gap-6 text-gray-500">
          <div className="flex items-center gap-2">
            <Monitor className="h-4 w-4" />
            <span className="text-sm">Windows</span>
          </div>
          <div className="flex items-center gap-2">
            <Apple className="h-4 w-4" />
            <span className="text-sm">macOS</span>
          </div>
          <div className="flex items-center gap-2">
            <Terminal className="h-4 w-4" />
            <span className="text-sm">Linux</span>
          </div>
        </div>
        <p className="mt-3 text-xs text-gray-600">Available on all platforms</p>
      </div>
    </Section>
  );
};

// =============================================================================
// 11. FOOTER
// =============================================================================
const FOOTER_LINKS = {
  Product: ['Features', 'Changelog', 'Roadmap', 'Download'],
  Resources: ['Documentation', 'Help Center', 'API Reference', 'Blog'],
  Community: ['GitHub', 'Discord', 'Twitter/X', 'Contributing'],
  Legal: ['Privacy Policy', 'Terms of Service', 'License (MIT)'],
};

const Footer: React.FC<{
  onGetStarted: () => void;
  onExploreFeatures: () => void;
}> = ({ onGetStarted, onExploreFeatures }) => {
  const scrollToTop = useCallback(() => {
    const container = document.getElementById('landing-scroll-container');
    if (container) container.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <footer className="border-t border-white/[0.06] bg-[#08090c] px-6 py-16 md:px-12 lg:px-20">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {Object.entries(FOOTER_LINKS).map(([category, links]) => (
            <div key={category}>
              <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
                {category}
              </h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link}>
                    <button
                      onClick={
                        ['Download', 'Features', 'Changelog', 'Roadmap'].includes(link)
                          ? onGetStarted
                          : onExploreFeatures
                      }
                      className="text-sm text-gray-500 transition-colors hover:text-forge-400"
                    >
                      {link}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/[0.06] pt-8 md:flex-row">
          <div className="flex items-center gap-3">
            <Swords className="h-5 w-5 text-forge-500" />
            <span className="font-bold text-white">DebateForge</span>
          </div>
          <p className="text-xs text-gray-600">
            &copy; 2026 DebateForge &middot; Built with &#10084;&#65039;, TypeScript, and too many API calls
          </p>
          <button
            onClick={scrollToTop}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Back to top"
          >
            <ArrowUp className="h-3 w-3" />
            Back to top
          </button>
        </div>
      </div>
    </footer>
  );
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================
const LandingView: React.FC<LandingViewProps> = ({ onGetStarted, onExploreFeatures }) => {
  useEffect(() => {
    injectStyles();
  }, []);

  return (
    <div
      id="landing-scroll-container"
      className="h-full w-full overflow-y-auto scroll-smooth bg-[#0a0b0f]"
      style={{ colorScheme: 'dark' }}
    >
      <AnnouncementBar onExploreFeatures={onExploreFeatures} />
      <HeroSection onGetStarted={onGetStarted} onExploreFeatures={onExploreFeatures} />
      <LogoTrustBar />
      <FeaturesGrid />
      <TimelineSection />
      <LiveDemoSection />
      <TestimonialsSection />
      <StatsSection />
      <FAQSection />
      <FinalCTA onGetStarted={onGetStarted} />
      <Footer onGetStarted={onGetStarted} onExploreFeatures={onExploreFeatures} />
    </div>
  );
};

export default LandingView;
