import React from 'react';
import clsx from 'clsx';
import {
  Swords, Shield, Code, Scale, Globe, BookOpen, Trophy,
  Cpu, Users, AlertTriangle, Zap, TestTube, Languages,
  Layers, Palette, Database, Server, Monitor,
  ExternalLink, Bug, Lightbulb, Heart, Github,
} from 'lucide-react';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';

/* ─── Tech Stack Data ─────────────────────────────────────────────────────── */

interface TechItem {
  name: string;
  version: string;
  color: string;
  bgColor: string;
  icon: React.FC<{ className?: string }>;
}

const TECH_STACK: TechItem[] = [
  { name: 'Electron', version: '33', color: 'text-cyan-600 dark:text-cyan-400', bgColor: 'bg-cyan-100 dark:bg-cyan-900/30', icon: Monitor },
  { name: 'React', version: '19', color: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-100 dark:bg-blue-900/30', icon: Layers },
  { name: 'TypeScript', version: '5.7', color: 'text-blue-700 dark:text-blue-300', bgColor: 'bg-blue-100 dark:bg-blue-900/30', icon: Code },
  { name: 'Tailwind CSS', version: '3.4', color: 'text-teal-600 dark:text-teal-400', bgColor: 'bg-teal-100 dark:bg-teal-900/30', icon: Palette },
  { name: 'Zustand', version: '5.0', color: 'text-amber-600 dark:text-amber-400', bgColor: 'bg-amber-100 dark:bg-amber-900/30', icon: Database },
  { name: 'Vite', version: '6', color: 'text-purple-600 dark:text-purple-400', bgColor: 'bg-purple-100 dark:bg-purple-900/30', icon: Zap },
  { name: 'SQLite', version: '3', color: 'text-emerald-600 dark:text-emerald-400', bgColor: 'bg-emerald-100 dark:bg-emerald-900/30', icon: Database },
  { name: 'Vitest', version: '2', color: 'text-green-600 dark:text-green-400', bgColor: 'bg-green-100 dark:bg-green-900/30', icon: TestTube },
];

/* ─── AI Providers Data ───────────────────────────────────────────────────── */

interface ProviderCard {
  name: string;
  description: string;
  models: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

const AI_PROVIDERS: ProviderCard[] = [
  {
    name: 'Anthropic',
    description: 'Claude models with extended thinking and nuanced reasoning',
    models: 'Claude 3.5, Claude 4, Opus',
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
    borderColor: 'hover:border-amber-300 dark:hover:border-amber-700',
  },
  {
    name: 'OpenAI',
    description: 'GPT and reasoning models with advanced capabilities',
    models: 'GPT-4o, o1, o3',
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
    borderColor: 'hover:border-emerald-300 dark:hover:border-emerald-700',
  },
  {
    name: 'Google',
    description: 'Gemini models with multimodal understanding',
    models: 'Gemini 2.5 Pro, Flash',
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    borderColor: 'hover:border-blue-300 dark:hover:border-blue-700',
  },
  {
    name: 'Ollama',
    description: 'Run open-source models locally on your machine',
    models: 'Llama, DeepSeek, Mistral, etc.',
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    borderColor: 'hover:border-purple-300 dark:hover:border-purple-700',
  },
  {
    name: 'LM Studio',
    description: 'OpenAI-compatible local inference server',
    models: 'Any GGUF model',
    color: 'text-rose-600 dark:text-rose-400',
    bgColor: 'bg-rose-100 dark:bg-rose-900/30',
    borderColor: 'hover:border-rose-300 dark:hover:border-rose-700',
  },
];

/* ─── Key Stats Data ──────────────────────────────────────────────────────── */

interface StatItem {
  value: string;
  label: string;
  icon: React.FC<{ className?: string }>;
  color: string;
  bgColor: string;
}

const KEY_STATS: StatItem[] = [
  { value: '76+', label: 'UI Components', icon: Layers, color: 'text-forge-600 dark:text-forge-400', bgColor: 'bg-forge-100 dark:bg-forge-900/30' },
  { value: '168', label: 'Unit Tests', icon: TestTube, color: 'text-emerald-600 dark:text-emerald-400', bgColor: 'bg-emerald-100 dark:bg-emerald-900/30' },
  { value: '14+', label: 'Fallacy Patterns', icon: AlertTriangle, color: 'text-amber-600 dark:text-amber-400', bgColor: 'bg-amber-100 dark:bg-amber-900/30' },
  { value: '3', label: 'Debate Formats', icon: BookOpen, color: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-100 dark:bg-blue-900/30' },
  { value: '8', label: 'Built-in Personas', icon: Users, color: 'text-purple-600 dark:text-purple-400', bgColor: 'bg-purple-100 dark:bg-purple-900/30' },
  { value: '12', label: 'Languages', icon: Languages, color: 'text-teal-600 dark:text-teal-400', bgColor: 'bg-teal-100 dark:bg-teal-900/30' },
];

/* ─── About View ──────────────────────────────────────────────────────────── */

const AboutView: React.FC = () => {
  return (
    <div className="mx-auto max-w-5xl px-6 py-6">
      {/* ── App Hero ─────────────────────────────────────────────────────── */}
      <section className="mb-10 text-center">
        <div className="relative mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-forge-500 via-forge-600 to-purple-600 shadow-xl shadow-forge-500/30">
          <Swords className="h-10 w-10 text-white" />
          {/* Decorative glow */}
          <div className="absolute -inset-2 -z-10 rounded-3xl bg-gradient-to-br from-forge-500/20 to-purple-500/20 blur-xl" />
        </div>
        <h1 className="text-3xl font-black text-gray-900 dark:text-gray-50">
          DebateForge
        </h1>
        <div className="mt-2 flex items-center justify-center gap-2">
          <Badge variant="info" size="md">v1.0.0</Badge>
        </div>
        <p className="mt-2 text-sm font-medium text-gray-500 dark:text-gray-400">
          AI-Powered Debate Arena
        </p>
      </section>

      {/* ── Mission Statement ────────────────────────────────────────────── */}
      <section className="mb-8">
        <Card variant="gradient" className="relative overflow-hidden">
          <div className="relative z-10 flex gap-4">
            <div className="hidden sm:flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-forge-100 dark:bg-forge-900/30">
              <Heart className="h-6 w-6 text-forge-600 dark:text-forge-400" />
            </div>
            <div>
              <h2 className="mb-2 text-base font-semibold text-gray-900 dark:text-gray-100">Our Mission</h2>
              <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                DebateForge was built to make rigorous intellectual debate accessible to everyone.
                By harnessing the power of multiple AI models, we create structured debates with
                real evidence verification, logical fallacy detection, and fair scoring. Whether
                you're a student, researcher, or curious thinker, DebateForge helps you explore
                ideas from every angle.
              </p>
            </div>
          </div>
          {/* Background decoration */}
          <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-forge-200/20 blur-3xl dark:bg-forge-800/10" />
          <div className="absolute -bottom-12 -left-12 h-32 w-32 rounded-full bg-purple-200/20 blur-3xl dark:bg-purple-800/10" />
        </Card>
      </section>

      {/* ── Tech Stack ───────────────────────────────────────────────────── */}
      <section className="mb-8">
        <div className="mb-4 flex items-center gap-2">
          <Code className="h-5 w-5 text-forge-600 dark:text-forge-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Tech Stack</h2>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {TECH_STACK.map((tech) => {
            const Icon = tech.icon;
            return (
              <div
                key={tech.name}
                className="group flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 transition-all duration-200 hover:border-gray-300 hover:shadow-sm dark:border-surface-dark-3 dark:bg-surface-dark-1 dark:hover:border-surface-dark-4"
              >
                <div className={clsx('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-transform group-hover:scale-110', tech.bgColor)}>
                  <Icon className={clsx('h-4.5 w-4.5', tech.color)} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{tech.name}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">v{tech.version}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── AI Providers ─────────────────────────────────────────────────── */}
      <section className="mb-8">
        <div className="mb-4 flex items-center gap-2">
          <Cpu className="h-5 w-5 text-forge-600 dark:text-forge-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">AI Providers</h2>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {AI_PROVIDERS.map((provider) => (
            <div
              key={provider.name}
              className={clsx(
                'group rounded-xl border border-gray-200 bg-white p-4 transition-all duration-200 hover:shadow-md dark:border-surface-dark-3 dark:bg-surface-dark-1',
                provider.borderColor,
              )}
            >
              <div className="mb-3 flex items-center gap-3">
                <div className={clsx('flex h-10 w-10 items-center justify-center rounded-xl transition-transform group-hover:scale-110', provider.bgColor)}>
                  <Server className={clsx('h-5 w-5', provider.color)} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">{provider.name}</h3>
                  <p className="text-xs text-gray-400 dark:text-gray-500">{provider.models}</p>
                </div>
              </div>
              <p className="text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                {provider.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Key Stats ────────────────────────────────────────────────────── */}
      <section className="mb-8">
        <div className="mb-4 flex items-center gap-2">
          <Trophy className="h-5 w-5 text-forge-600 dark:text-forge-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Key Stats</h2>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {KEY_STATS.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label} className="group !p-4 text-center transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
                <div className={clsx('mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl transition-transform group-hover:scale-110', stat.bgColor)}>
                  <Icon className={clsx('h-5 w-5', stat.color)} />
                </div>
                <p className="text-2xl font-black tabular-nums text-gray-900 dark:text-gray-100">{stat.value}</p>
                <p className="mt-0.5 text-xs font-medium text-gray-500 dark:text-gray-400">{stat.label}</p>
              </Card>
            );
          })}
        </div>
      </section>

      {/* ── License ──────────────────────────────────────────────────────── */}
      <section className="mb-8">
        <Card>
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
              <Scale className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h2 className="mb-1 text-base font-semibold text-gray-900 dark:text-gray-100">MIT License</h2>
              <p className="text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                DebateForge is open-source software released under the MIT License.
                You are free to use, modify, and distribute this software for any purpose,
                commercial or non-commercial. The only requirement is that the license
                and copyright notice are included with the software.
              </p>
              <div className="mt-3">
                <Badge variant="success" size="sm">Open Source</Badge>
              </div>
            </div>
          </div>
        </Card>
      </section>

      {/* ── Links ────────────────────────────────────────────────────────── */}
      <section className="mb-8">
        <div className="mb-4 flex items-center gap-2">
          <Globe className="h-5 w-5 text-forge-600 dark:text-forge-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Links</h2>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            {
              icon: Github,
              label: 'GitHub Repository',
              description: 'View source code and contribute',
              href: 'https://github.com/debateforge/debateforge',
              color: 'text-gray-700 dark:text-gray-300',
              bgColor: 'bg-gray-100 dark:bg-gray-800/50',
            },
            {
              icon: Bug,
              label: 'Report a Bug',
              description: 'Found an issue? Let us know',
              href: 'https://github.com/debateforge/debateforge/issues/new?template=bug_report.md',
              color: 'text-red-600 dark:text-red-400',
              bgColor: 'bg-red-100 dark:bg-red-900/30',
            },
            {
              icon: Lightbulb,
              label: 'Feature Request',
              description: 'Suggest a new feature',
              href: 'https://github.com/debateforge/debateforge/issues/new?template=feature_request.md',
              color: 'text-amber-600 dark:text-amber-400',
              bgColor: 'bg-amber-100 dark:bg-amber-900/30',
            },
          ].map((link) => {
            const Icon = link.icon;
            return (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 transition-all duration-200 hover:border-gray-300 hover:shadow-md dark:border-surface-dark-3 dark:bg-surface-dark-1 dark:hover:border-surface-dark-4"
              >
                <div className={clsx('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-110', link.bgColor)}>
                  <Icon className={clsx('h-5 w-5', link.color)} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 group-hover:text-forge-600 dark:group-hover:text-forge-400 transition-colors">
                    {link.label}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">{link.description}</p>
                </div>
                <ExternalLink className="h-4 w-4 shrink-0 text-gray-300 dark:text-gray-600 opacity-0 transition-opacity group-hover:opacity-100" />
              </a>
            );
          })}
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <div className="border-t border-gray-200 pt-6 pb-4 text-center dark:border-surface-dark-3">
        <p className="text-xs text-gray-400 dark:text-gray-500">
          Built with passion for intellectual discourse. DebateForge v1.0.0
        </p>
      </div>
    </div>
  );
};

export default AboutView;
