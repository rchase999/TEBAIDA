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
  ChevronRight,
  Star,
  ArrowRight,
  Brain,
  Target,
  BookOpen,
  Crown,
  Check,
  Sparkles,
  Globe,
  Monitor,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface LandingViewProps {
  onGetStarted: () => void;
  onExploreFeatures: () => void;
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
    let start: number | null = null;
    let raf: number;
    const step = (ts: number) => {
      if (start === null) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      // easeOutQuart
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
// Typewriter hook
// ---------------------------------------------------------------------------
function useTypewriter(text: string, speed = 40, startDelay = 600): string {
  const [displayed, setDisplayed] = useState('');

  useEffect(() => {
    setDisplayed('');
    let idx = 0;
    let timeout: ReturnType<typeof setTimeout>;

    const type = () => {
      if (idx <= text.length) {
        setDisplayed(text.slice(0, idx));
        idx++;
        timeout = setTimeout(type, speed);
      }
    };

    timeout = setTimeout(type, startDelay);
    return () => clearTimeout(timeout);
  }, [text, speed, startDelay]);

  return displayed;
}

// ---------------------------------------------------------------------------
// Floating particles background
// ---------------------------------------------------------------------------
const Particles: React.FC = React.memo(() => {
  const dots = useMemo(
    () =>
      Array.from({ length: 40 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: 2 + Math.random() * 3,
        duration: 12 + Math.random() * 20,
        delay: Math.random() * 10,
        opacity: 0.15 + Math.random() * 0.25,
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
            animation: `landingFloat ${d.duration}s ease-in-out ${d.delay}s infinite alternate`,
          }}
        />
      ))}
    </div>
  );
});
Particles.displayName = 'Particles';

// ---------------------------------------------------------------------------
// Speech-bubble clash illustration (CSS art)
// ---------------------------------------------------------------------------
const ClashIllustration: React.FC = () => (
  <div className="relative mx-auto h-48 w-72 select-none sm:h-56 sm:w-80" aria-hidden>
    {/* Left bubble */}
    <div
      className="absolute left-0 top-6 h-28 w-36 rounded-2xl rounded-bl-sm bg-gradient-to-br from-forge-400 to-forge-600 shadow-xl shadow-forge-600/30"
      style={{ animation: 'landingBubbleLeft 3s ease-in-out infinite' }}
    >
      <div className="flex h-full flex-col justify-center px-4">
        <div className="mb-1.5 h-2 w-20 rounded-full bg-white/30" />
        <div className="mb-1.5 h-2 w-16 rounded-full bg-white/20" />
        <div className="h-2 w-24 rounded-full bg-white/25" />
      </div>
      {/* Tail */}
      <div className="absolute -bottom-2 left-3 h-4 w-4 rotate-45 rounded-sm bg-forge-600" />
    </div>

    {/* Right bubble */}
    <div
      className="absolute right-0 top-10 h-28 w-36 rounded-2xl rounded-br-sm bg-gradient-to-br from-purple-400 to-purple-700 shadow-xl shadow-purple-700/30"
      style={{ animation: 'landingBubbleRight 3s ease-in-out infinite' }}
    >
      <div className="flex h-full flex-col items-end justify-center px-4">
        <div className="mb-1.5 h-2 w-20 rounded-full bg-white/30" />
        <div className="mb-1.5 h-2 w-14 rounded-full bg-white/20" />
        <div className="h-2 w-22 rounded-full bg-white/25" />
      </div>
      {/* Tail */}
      <div className="absolute -bottom-2 right-3 h-4 w-4 rotate-45 rounded-sm bg-purple-700" />
    </div>

    {/* Lightning bolt center */}
    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
      <Zap
        className="h-12 w-12 text-yellow-400 drop-shadow-lg"
        style={{ animation: 'landingLightning 2s ease-in-out infinite', filter: 'drop-shadow(0 0 12px rgba(250,204,21,0.6))' }}
        fill="currentColor"
      />
    </div>

    {/* Small sparks */}
    {[...Array(6)].map((_, i) => (
      <span
        key={i}
        className="absolute rounded-full bg-yellow-300"
        style={{
          width: 3 + Math.random() * 3,
          height: 3 + Math.random() * 3,
          left: `${40 + Math.random() * 20}%`,
          top: `${35 + Math.random() * 30}%`,
          opacity: 0,
          animation: `landingSpark 2s ease-out ${0.3 + i * 0.25}s infinite`,
        }}
      />
    ))}
  </div>
);

// ---------------------------------------------------------------------------
// TrustBar / Marquee
// ---------------------------------------------------------------------------
const PROVIDERS = [
  { name: 'Anthropic (Claude)', icon: Brain },
  { name: 'OpenAI (GPT-4)', icon: Sparkles },
  { name: 'Google (Gemini)', icon: Globe },
  { name: 'Ollama', icon: Monitor },
  { name: 'LM Studio', icon: Cpu },
];

const TrustBar: React.FC = () => {
  // Duplicate so the marquee loops seamlessly
  const items = [...PROVIDERS, ...PROVIDERS];
  return (
    <div className="relative overflow-hidden border-y border-white/10 bg-black/20 py-4 backdrop-blur-sm">
      <p className="mb-3 text-center text-xs font-medium uppercase tracking-widest text-white/40">
        Powered by
      </p>
      <div className="flex animate-[landingMarquee_24s_linear_infinite] gap-12 whitespace-nowrap">
        {items.map((p, i) => {
          const Icon = p.icon;
          return (
            <span key={`${p.name}-${i}`} className="inline-flex items-center gap-2 text-sm font-medium text-white/60">
              <Icon className="h-4 w-4" />
              {p.name}
            </span>
          );
        })}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Feature card for the grid
// ---------------------------------------------------------------------------
interface FeatureItem {
  icon: React.FC<{ className?: string; fill?: string }>;
  title: string;
  description: string;
  color: string;
  bgColor: string;
}

const FEATURES: FeatureItem[] = [
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
    description: '8 pre-built debater personas with unique expertise, rhetorical styles, and argumentation strategies.',
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
  },
  {
    icon: Cpu,
    title: 'Multi-Model Arena',
    description: 'Pit Claude, GPT-4, Gemini, Ollama, and LM Studio models head-to-head in structured debates.',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
  },
  {
    icon: AlertTriangle,
    title: 'Fallacy Detection',
    description: 'Automatic identification of 14+ logical fallacies with severity ratings and explanations.',
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
  },
  {
    icon: Trophy,
    title: 'Tournament Mode',
    description: 'Run bracket-style tournaments across multiple models and topics with automated scheduling.',
    color: 'text-rose-500',
    bgColor: 'bg-rose-500/10',
  },
  {
    icon: Crown,
    title: 'ELO Rankings',
    description: 'Chess-style rating system tracks model performance over time with head-to-head records.',
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/10',
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
        'hover:shadow-xl hover:-translate-y-1.5 hover:border-gray-300',
        'dark:border-surface-dark-3 dark:bg-surface-dark-1 dark:hover:border-surface-dark-4 dark:hover:shadow-2xl dark:hover:shadow-forge-900/10',
        visible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0',
      )}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      <div
        className={clsx(
          'mb-4 flex h-12 w-12 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110',
          feature.bgColor,
        )}
      >
        <Icon className={clsx('h-6 w-6', feature.color)} />
      </div>
      <h3 className="mb-1.5 text-base font-bold text-gray-900 dark:text-gray-100">{feature.title}</h3>
      <p className="text-sm leading-relaxed text-gray-500 dark:text-gray-400">{feature.description}</p>

      {/* Decorative corner glow */}
      <div
        className={clsx(
          'absolute -right-6 -top-6 h-20 w-20 rounded-full opacity-0 transition-opacity duration-300 group-hover:opacity-100 blur-2xl',
          feature.bgColor,
        )}
      />
    </div>
  );
};

// ---------------------------------------------------------------------------
// How It Works (4 steps)
// ---------------------------------------------------------------------------
interface StepItem {
  icon: React.FC<{ className?: string }>;
  title: string;
  description: string;
}

const STEPS: StepItem[] = [
  { icon: Target, title: 'Choose a Topic', description: 'Pick from suggested topics or write your own debate motion on any subject.' },
  { icon: Cpu, title: 'Pick Your Models', description: 'Select which AI models will argue each side and assign unique personas.' },
  { icon: Play, title: 'Watch Them Debate', description: 'AI models exchange arguments in real time with streaming responses and evidence.' },
  { icon: BarChart3, title: 'Analyze Results', description: 'Review momentum graphs, fallacy reports, evidence scores, and ELO changes.' },
];

const HowItWorks: React.FC<{ visible: boolean }> = ({ visible }) => (
  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
    {STEPS.map((step, i) => {
      const Icon = step.icon;
      return (
        <div
          key={step.title}
          className={clsx(
            'relative flex flex-col items-center text-center transition-all duration-700',
            visible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0',
          )}
          style={{ transitionDelay: `${i * 150}ms` }}
        >
          {/* Connector line (not on last item) */}
          {i < STEPS.length - 1 && (
            <div className="pointer-events-none absolute -right-3 top-8 hidden w-6 lg:block" aria-hidden>
              <ArrowRight className="h-5 w-5 text-gray-300 dark:text-surface-dark-4" />
            </div>
          )}

          {/* Step number circle */}
          <div className="relative mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-forge-500 to-purple-600 shadow-lg shadow-forge-500/20">
              <Icon className="h-7 w-7 text-white" />
            </div>
            <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs font-bold text-forge-700 shadow ring-2 ring-forge-200 dark:bg-surface-dark-1 dark:text-forge-400 dark:ring-forge-800">
              {i + 1}
            </span>
          </div>

          <h4 className="mb-1 text-sm font-bold text-gray-900 dark:text-gray-100">{step.title}</h4>
          <p className="text-xs leading-relaxed text-gray-500 dark:text-gray-400 max-w-[200px]">{step.description}</p>
        </div>
      );
    })}
  </div>
);

// ---------------------------------------------------------------------------
// Showcase section (tabbed previews)
// ---------------------------------------------------------------------------
type ShowcaseTab = 'transcript' | 'momentum' | 'leaderboard';

const SAMPLE_TRANSCRIPT = [
  { speaker: 'Claude (Proposition)', color: 'text-blue-400', text: 'The evidence overwhelmingly supports that AI regulation must be proactive rather than reactive. The EU AI Act demonstrates that structured oversight accelerates innovation by providing clear boundaries for development...' },
  { speaker: 'GPT-4 (Opposition)', color: 'text-rose-400', text: 'While regulatory frameworks have their place, premature regulation of AI risks stifling the very innovation it claims to protect. Consider how early internet regulations in some nations led to decades of technological stagnation...' },
  { speaker: 'Claude (Rebuttal)', color: 'text-blue-400', text: 'My opponent conflates reasonable guardrails with overreach. The financial sector proves that smart regulation -- like Basel III requirements -- creates stability and consumer trust without halting progress...' },
];

const SAMPLE_LEADERBOARD = [
  { rank: 1, name: 'Claude Sonnet 4', elo: 1647, wins: 12, losses: 3, provider: 'Anthropic' },
  { rank: 2, name: 'GPT-4o', elo: 1589, wins: 10, losses: 5, provider: 'OpenAI' },
  { rank: 3, name: 'Gemini 2.5 Pro', elo: 1534, wins: 8, losses: 4, provider: 'Google' },
  { rank: 4, name: 'Llama 3.3 70B', elo: 1478, wins: 6, losses: 6, provider: 'Ollama' },
];

const MOMENTUM_POINTS = [52, 48, 55, 45, 58, 42, 62, 38, 57, 43, 64, 36, 60, 40, 66, 34];

const ShowcaseSection: React.FC<{ visible: boolean }> = ({ visible }) => {
  const [tab, setTab] = useState<ShowcaseTab>('transcript');

  const tabs: { id: ShowcaseTab; label: string }[] = [
    { id: 'transcript', label: 'Debate Transcript' },
    { id: 'momentum', label: 'Momentum Graph' },
    { id: 'leaderboard', label: 'Leaderboard' },
  ];

  return (
    <div
      className={clsx(
        'overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg transition-all duration-700 dark:border-surface-dark-3 dark:bg-surface-dark-1',
        visible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0',
      )}
    >
      {/* Tab bar */}
      <div className="flex border-b border-gray-200 dark:border-surface-dark-3">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={clsx(
              'flex-1 px-4 py-3 text-xs font-semibold uppercase tracking-wider transition-colors',
              tab === t.id
                ? 'border-b-2 border-forge-500 text-forge-600 dark:text-forge-400'
                : 'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-6">
        {tab === 'transcript' && (
          <div className="space-y-4">
            {SAMPLE_TRANSCRIPT.map((line, i) => (
              <div key={i} className="flex gap-3">
                <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-100 dark:bg-surface-dark-3">
                  <Swords className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
                </div>
                <div className="min-w-0">
                  <p className={clsx('text-xs font-bold', line.color)}>{line.speaker}</p>
                  <p className="mt-0.5 text-sm leading-relaxed text-gray-600 dark:text-gray-300">{line.text}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'momentum' && (
          <div>
            <div className="mb-3 flex items-center justify-between text-xs">
              <span className="font-semibold text-blue-400">Proposition</span>
              <span className="text-gray-400 dark:text-gray-500">Debate Momentum Over Time</span>
              <span className="font-semibold text-rose-400">Opposition</span>
            </div>
            {/* SVG bar chart showing momentum swings */}
            <div className="relative h-40">
              <svg viewBox="0 0 400 120" className="h-full w-full" preserveAspectRatio="none">
                {/* Center line */}
                <line x1="0" y1="60" x2="400" y2="60" stroke="currentColor" className="text-gray-200 dark:text-surface-dark-4" strokeWidth="1" strokeDasharray="4 4" />
                {/* Proposition line (top=0 means 100% proposition) */}
                <polyline
                  fill="none"
                  stroke="#60a5fa"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={MOMENTUM_POINTS.filter((_, i) => i % 2 === 0)
                    .map((val, i) => `${i * (400 / 7)},${120 - (val / 100) * 120}`)
                    .join(' ')}
                />
                {/* Opposition line */}
                <polyline
                  fill="none"
                  stroke="#f87171"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={MOMENTUM_POINTS.filter((_, i) => i % 2 === 1)
                    .map((val, i) => `${i * (400 / 7)},${120 - (val / 100) * 120}`)
                    .join(' ')}
                />
                {/* Dots on proposition */}
                {MOMENTUM_POINTS.filter((_, i) => i % 2 === 0).map((val, i) => (
                  <circle key={`p-${i}`} cx={i * (400 / 7)} cy={120 - (val / 100) * 120} r="3" fill="#60a5fa" />
                ))}
                {/* Dots on opposition */}
                {MOMENTUM_POINTS.filter((_, i) => i % 2 === 1).map((val, i) => (
                  <circle key={`o-${i}`} cx={i * (400 / 7)} cy={120 - (val / 100) * 120} r="3" fill="#f87171" />
                ))}
              </svg>
              {/* Y-axis labels */}
              <span className="absolute left-0 top-0 text-[10px] text-blue-400">100%</span>
              <span className="absolute left-0 bottom-0 text-[10px] text-rose-400">0%</span>
            </div>
            <div className="mt-2 flex justify-between text-[10px] text-gray-400 dark:text-gray-500">
              <span>Opening</span>
              <span>Round 2</span>
              <span>Round 3</span>
              <span>Rebuttals</span>
              <span>Round 5</span>
              <span>Round 6</span>
              <span>Closing</span>
              <span>Verdict</span>
            </div>
          </div>
        )}

        {tab === 'leaderboard' && (
          <div className="space-y-2">
            <div className="grid grid-cols-[2rem_1fr_4rem_3.5rem_3.5rem] gap-2 text-xs font-semibold text-gray-400 dark:text-gray-500 pb-2 border-b border-gray-100 dark:border-surface-dark-3">
              <span className="text-center">#</span>
              <span>Model</span>
              <span className="text-right">ELO</span>
              <span className="text-right">W</span>
              <span className="text-right">L</span>
            </div>
            {SAMPLE_LEADERBOARD.map((entry) => (
              <div
                key={entry.rank}
                className="grid grid-cols-[2rem_1fr_4rem_3.5rem_3.5rem] gap-2 items-center rounded-lg py-2 px-1 text-sm transition-colors hover:bg-gray-50 dark:hover:bg-surface-dark-2"
              >
                <span
                  className={clsx(
                    'text-center text-xs font-bold',
                    entry.rank === 1
                      ? 'text-amber-500'
                      : entry.rank === 2
                        ? 'text-gray-400'
                        : entry.rank === 3
                          ? 'text-amber-700'
                          : 'text-gray-400 dark:text-gray-500',
                  )}
                >
                  {entry.rank === 1 ? <Crown className="mx-auto h-4 w-4 text-amber-500" /> : entry.rank}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-medium text-gray-900 dark:text-gray-100">{entry.name}</p>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500">{entry.provider}</p>
                </div>
                <span className="text-right font-bold tabular-nums text-gray-900 dark:text-gray-100">{entry.elo}</span>
                <span className="text-right tabular-nums text-emerald-500">{entry.wins}</span>
                <span className="text-right tabular-nums text-red-400">{entry.losses}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Stat counter items
// ---------------------------------------------------------------------------
interface StatItem {
  value: number;
  suffix: string;
  label: string;
  icon: React.FC<{ className?: string }>;
}

const STATS: StatItem[] = [
  { value: 3, suffix: '', label: 'Debate Formats', icon: BookOpen },
  { value: 14, suffix: '+', label: 'Fallacy Patterns', icon: AlertTriangle },
  { value: 7, suffix: '', label: 'AI Providers', icon: Globe },
  { value: 8, suffix: '', label: 'Personas', icon: Users },
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
      <Icon className="mb-2 h-6 w-6 text-forge-400" />
      <span className="text-3xl font-extrabold tabular-nums text-gray-900 dark:text-white sm:text-4xl">
        {count}
        {stat.suffix}
      </span>
      <span className="mt-1 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
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
      100% { transform: translateY(-18px) translateX(6px); }
    }
    @keyframes landingBubbleLeft {
      0%, 100% { transform: translateX(0) rotate(0deg); }
      50% { transform: translateX(10px) rotate(1deg); }
    }
    @keyframes landingBubbleRight {
      0%, 100% { transform: translateX(0) rotate(0deg); }
      50% { transform: translateX(-10px) rotate(-1deg); }
    }
    @keyframes landingLightning {
      0%, 100% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.2); opacity: 0.7; }
      75% { transform: scale(0.95); opacity: 1; }
    }
    @keyframes landingSpark {
      0% { transform: scale(0); opacity: 1; }
      50% { opacity: 0.8; }
      100% { transform: scale(1) translate(var(--tx, 12px), var(--ty, -12px)); opacity: 0; }
    }
    @keyframes landingMarquee {
      0% { transform: translateX(0); }
      100% { transform: translateX(-50%); }
    }
    @keyframes landingGlowPulse {
      0%, 100% { box-shadow: 0 0 20px rgba(92,124,250,0.3), 0 0 60px rgba(92,124,250,0.1); }
      50% { box-shadow: 0 0 30px rgba(92,124,250,0.5), 0 0 80px rgba(92,124,250,0.2); }
    }
    @keyframes landingDotPattern {
      0% { background-position: 0 0; }
      100% { background-position: 20px 20px; }
    }
  `;
  document.head.appendChild(style);
}

// ---------------------------------------------------------------------------
// Main LandingView Component
// ---------------------------------------------------------------------------
const LandingView: React.FC<LandingViewProps> = ({ onGetStarted, onExploreFeatures }) => {
  // Inject custom keyframes on mount
  useEffect(() => {
    injectLandingStyles();
  }, []);

  // Typewriter subtitle
  const subtitle = useTypewriter('Watch the world\'s most powerful AI models argue any topic', 35, 800);

  // Scroll-triggered section refs
  const [featuresRef, featuresVisible] = useInView(0.1);
  const [stepsRef, stepsVisible] = useInView(0.1);
  const [showcaseRef, showcaseVisible] = useInView(0.1);
  const [statsRef, statsVisible] = useInView(0.2);
  const [ctaRef, ctaVisible] = useInView(0.2);

  // Scroll to features section
  const featuresSectionRef = useRef<HTMLDivElement>(null);
  const handleExploreFeatures = useCallback(() => {
    featuresSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    onExploreFeatures();
  }, [onExploreFeatures]);

  return (
    <div className="relative min-h-screen overflow-y-auto overflow-x-hidden bg-white dark:bg-surface-dark-0">
      {/* ================================================================ */}
      {/* HERO SECTION                                                     */}
      {/* ================================================================ */}
      <section className="relative overflow-hidden">
        {/* Background gradient */}
        <div
          className="absolute inset-0 bg-gradient-to-br from-forge-500 via-forge-600 to-purple-700"
          aria-hidden
        />

        {/* Subtle dot pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
          aria-hidden
        />

        {/* Floating particles */}
        <Particles />

        {/* Radial glow at center */}
        <div
          className="absolute left-1/2 top-1/3 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/5 blur-[100px]"
          aria-hidden
        />

        <div className="relative z-10 mx-auto max-w-6xl px-6 pb-16 pt-20 sm:pb-24 sm:pt-28">
          <div className="flex flex-col items-center lg:flex-row lg:items-center lg:justify-between lg:gap-12">
            {/* Left: Text Content */}
            <div className="mb-12 max-w-xl text-center lg:mb-0 lg:text-left">
              {/* Badge */}
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-medium text-white/80 backdrop-blur-sm">
                <Sparkles className="h-3.5 w-3.5" />
                DebateForge v1.0
              </div>

              {/* Headline */}
              <h1 className="mb-4 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
                <span
                  className="bg-gradient-to-r from-white via-white to-purple-200 bg-clip-text text-transparent"
                  style={{ WebkitBackgroundClip: 'text' }}
                >
                  AI-Powered
                </span>
                <br />
                <span
                  className="bg-gradient-to-r from-purple-200 via-yellow-200 to-white bg-clip-text text-transparent"
                  style={{ WebkitBackgroundClip: 'text' }}
                >
                  Debate Arena
                </span>
              </h1>

              {/* Typewriter subtitle */}
              <p className="mb-8 min-h-[2.5rem] text-lg font-medium text-white/70 sm:text-xl">
                {subtitle}
                <span className="ml-0.5 inline-block w-0.5 h-5 bg-white/60 animate-pulse-soft align-middle" />
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
                <button
                  onClick={onGetStarted}
                  className="inline-flex items-center justify-center gap-2.5 rounded-xl bg-white px-8 py-3.5 text-base font-bold text-forge-700 shadow-lg transition-all duration-200 hover:bg-gray-50 hover:shadow-xl active:scale-[0.98]"
                  style={{ animation: 'landingGlowPulse 3s ease-in-out infinite' }}
                >
                  <Swords className="h-5 w-5" />
                  Start Your First Debate
                </button>
                <button
                  onClick={handleExploreFeatures}
                  className="inline-flex items-center justify-center gap-2.5 rounded-xl border-2 border-white/30 px-8 py-3.5 text-base font-bold text-white transition-all duration-200 hover:border-white/60 hover:bg-white/10 active:scale-[0.98]"
                >
                  Explore Features
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Right: Illustration */}
            <div className="flex-shrink-0 animate-float">
              <ClashIllustration />
            </div>
          </div>
        </div>

        {/* Trust Bar */}
        <TrustBar />
      </section>

      {/* ================================================================ */}
      {/* FEATURES GRID                                                    */}
      {/* ================================================================ */}
      <section
        ref={(el: HTMLDivElement | null) => {
          // Share ref between scroll observer and scroll-to
          (featuresRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
          (featuresSectionRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
        }}
        className="mx-auto max-w-6xl px-6 py-20 sm:py-28"
      >
        <div className="mb-12 text-center">
          <h2 className="mb-3 text-3xl font-extrabold text-gray-900 dark:text-white sm:text-4xl">
            Everything You Need for AI Debates
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
          <div className="mb-14 text-center">
            <h2 className="mb-3 text-3xl font-extrabold text-gray-900 dark:text-white sm:text-4xl">
              How It Works
            </h2>
            <p className="mx-auto max-w-lg text-base text-gray-500 dark:text-gray-400">
              From topic selection to detailed analysis in four simple steps.
            </p>
          </div>
          <HowItWorks visible={stepsVisible} />
        </div>
      </section>

      {/* ================================================================ */}
      {/* SHOWCASE (Tabbed Previews)                                       */}
      {/* ================================================================ */}
      <section ref={showcaseRef} className="mx-auto max-w-4xl px-6 py-20 sm:py-28">
        <div className="mb-12 text-center">
          <h2 className="mb-3 text-3xl font-extrabold text-gray-900 dark:text-white sm:text-4xl">
            See It in Action
          </h2>
          <p className="mx-auto max-w-lg text-base text-gray-500 dark:text-gray-400">
            Real debate transcripts, live momentum tracking, and competitive leaderboards.
          </p>
        </div>
        <ShowcaseSection visible={showcaseVisible} />
      </section>

      {/* ================================================================ */}
      {/* STATS COUNTER                                                    */}
      {/* ================================================================ */}
      <section
        ref={statsRef}
        className="border-y border-gray-100 bg-gray-50/70 py-16 dark:border-surface-dark-3 dark:bg-surface-dark-1/50 sm:py-20"
      >
        <div className="mx-auto grid max-w-4xl grid-cols-2 gap-8 px-6 sm:grid-cols-4">
          {STATS.map((stat, i) => (
            <StatCounter key={stat.label} stat={stat} active={statsVisible} index={i} />
          ))}
        </div>
      </section>

      {/* ================================================================ */}
      {/* FINAL CTA                                                        */}
      {/* ================================================================ */}
      <section ref={ctaRef} className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-forge-600 via-forge-700 to-purple-800" aria-hidden />
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
          aria-hidden
        />
        {/* Radial glow */}
        <div className="absolute left-1/2 top-1/2 h-[400px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/5 blur-[120px]" aria-hidden />

        <div
          className={clsx(
            'relative z-10 mx-auto max-w-3xl px-6 py-20 text-center transition-all duration-700 sm:py-28',
            ctaVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0',
          )}
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-medium text-white/70 backdrop-blur-sm">
            <Zap className="h-3.5 w-3.5" />
            Quick Setup
          </div>
          <h2 className="mb-4 text-3xl font-extrabold text-white sm:text-4xl lg:text-5xl">
            Ready to Start?
          </h2>
          <p className="mx-auto mb-8 max-w-lg text-lg text-white/70">
            Set up your API keys and run your first debate in 60 seconds.
          </p>
          <button
            onClick={onGetStarted}
            className="inline-flex items-center justify-center gap-2.5 rounded-xl bg-white px-10 py-4 text-lg font-bold text-forge-700 shadow-xl transition-all duration-200 hover:bg-gray-50 hover:shadow-2xl active:scale-[0.98]"
            style={{ animation: 'landingGlowPulse 3s ease-in-out infinite' }}
          >
            <ArrowRight className="h-5 w-5" />
            Get Started Now
          </button>
        </div>
      </section>

      {/* ================================================================ */}
      {/* FOOTER                                                           */}
      {/* ================================================================ */}
      <footer className="border-t border-gray-100 bg-white py-8 dark:border-surface-dark-3 dark:bg-surface-dark-0">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
            {/* Left: Logo + Version */}
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-forge-500 to-forge-700">
                <Swords className="h-4 w-4 text-white" />
              </div>
              <div>
                <span className="text-sm font-bold text-gray-900 dark:text-gray-100">DebateForge</span>
                <span className="ml-2 text-xs text-gray-400 dark:text-gray-500">v1.0.0</span>
              </div>
            </div>

            {/* Center: Tech badges */}
            <div className="flex flex-wrap items-center justify-center gap-2">
              {['React', 'Electron', 'TypeScript', 'Tailwind CSS'].map((tech) => (
                <span
                  key={tech}
                  className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-[10px] font-medium text-gray-500 dark:border-surface-dark-3 dark:bg-surface-dark-2 dark:text-gray-400"
                >
                  {tech}
                </span>
              ))}
            </div>

            {/* Right: License */}
            <div className="text-center text-xs text-gray-400 dark:text-gray-500 sm:text-right">
              <p>MIT License</p>
              <p className="mt-0.5">Made with React + Electron + TypeScript</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingView;
