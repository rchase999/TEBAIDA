import React, { useState, useMemo, useEffect, useCallback } from 'react';
import clsx from 'clsx';
import { v4 as uuidv4 } from 'uuid';
import {
  ChevronRight, ChevronLeft, Play, Lightbulb,
  Check, RefreshCw,
} from 'lucide-react';
import { useStore } from '../../store';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Select } from '../../components/Select';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { ProgressBar } from '../../components/ProgressBar';
import { DEBATE_FORMATS, OXFORD_UNION_FORMAT } from '../../../core/debate_engine/formats';
import type { DebaterConfig, ModelConfig, Persona, OpinionValue, DebateFormat, DebateFormatConfig } from '../../../types';

/* ------- constants ------- */

const STEP_LABELS = ['Topic', 'Debaters', 'Review', 'Your Opinion'];

const OPINION_OPTIONS: { value: OpinionValue; label: string; emoji: string; color: string; activeColor: string }[] = [
  {
    value: 'for',
    label: 'For',
    emoji: '\u{1F44D}',
    color: 'border-gray-200 text-gray-700 dark:border-surface-dark-4 dark:text-gray-300 hover:border-blue-400 hover:bg-blue-50 dark:hover:border-blue-600 dark:hover:bg-blue-900/20',
    activeColor: 'border-blue-500 bg-blue-50 text-blue-700 ring-2 ring-blue-500/30 dark:border-blue-500 dark:bg-blue-900/30 dark:text-blue-300',
  },
  {
    value: 'against',
    label: 'Against',
    emoji: '\u{1F44E}',
    color: 'border-gray-200 text-gray-700 dark:border-surface-dark-4 dark:text-gray-300 hover:border-rose-400 hover:bg-rose-50 dark:hover:border-rose-600 dark:hover:bg-rose-900/20',
    activeColor: 'border-rose-500 bg-rose-50 text-rose-700 ring-2 ring-rose-500/30 dark:border-rose-500 dark:bg-rose-900/30 dark:text-rose-300',
  },
  {
    value: 'undecided',
    label: 'Undecided',
    emoji: '\u{1F914}',
    color: 'border-gray-200 text-gray-700 dark:border-surface-dark-4 dark:text-gray-300 hover:border-amber-400 hover:bg-amber-50 dark:hover:border-amber-600 dark:hover:bg-amber-900/20',
    activeColor: 'border-amber-500 bg-amber-50 text-amber-700 ring-2 ring-amber-500/30 dark:border-amber-500 dark:bg-amber-900/30 dark:text-amber-300',
  },
];

const TOPIC_SUGGESTIONS = [
  'Should artificial intelligence be regulated by international law?',
  'Is universal basic income a viable economic policy?',
  'Does social media do more harm than good to society?',
  'Should space exploration be prioritized over solving Earth problems?',
  'Is democracy the best form of government?',
  'Should gene editing in humans be permitted?',
];

const MORE_TOPICS = [
  'Should the death penalty be abolished worldwide?',
  'Is nuclear energy the best solution to climate change?',
  'Should voting be mandatory in democracies?',
  'Are standardized tests an effective measure of intelligence?',
  'Should billionaires be taxed at 70% or higher?',
  'Is cancel culture a threat to free speech?',
  'Should animal testing for medical research be banned?',
  'Will cryptocurrency replace traditional banking?',
  'Should autonomous weapons be banned by international treaty?',
  'Is remote work better for society than office work?',
  'Should social media companies be liable for user content?',
  'Is space colonization a moral imperative?',
  'Should AI-generated content be watermarked by law?',
  'Is degrowth a viable strategy for combating climate change?',
  'Should governments regulate large language models?',
  'Is meritocracy a myth in modern society?',
];

const FORMAT_OPTIONS: { value: DebateFormat; label: string; desc: string; turns: number; needsHousemaster: boolean }[] = [
  { value: 'oxford-union', label: 'Oxford Union', desc: 'Classic 10-step structured debate with Housemaster', turns: 10, needsHousemaster: true },
  { value: 'lincoln-douglas', label: 'Lincoln-Douglas', desc: '1v1 values-focused debate, direct confrontation', turns: 8, needsHousemaster: false },
  { value: 'parliamentary', label: 'Parliamentary', desc: 'Speaker-managed debate with Government vs Opposition', turns: 8, needsHousemaster: true },
];

const CLOUD_MODELS: ModelConfig[] = [
  // Anthropic
  { id: 'claude-opus-4-20250514', provider: 'anthropic', name: 'claude-opus-4-20250514', displayName: 'Claude Opus 4', maxTokens: 8192, supportsStreaming: true },
  { id: 'claude-sonnet-4-20250514', provider: 'anthropic', name: 'claude-sonnet-4-20250514', displayName: 'Claude Sonnet 4', maxTokens: 8192, supportsStreaming: true },
  { id: 'claude-haiku-4-5-20251001', provider: 'anthropic', name: 'claude-haiku-4-5-20251001', displayName: 'Claude Haiku 4.5', maxTokens: 8192, supportsStreaming: true },
  { id: 'claude-3-5-sonnet-20241022', provider: 'anthropic', name: 'claude-3-5-sonnet-20241022', displayName: 'Claude 3.5 Sonnet', maxTokens: 8192, supportsStreaming: true },
  // OpenAI
  { id: 'gpt-4o', provider: 'openai', name: 'gpt-4o', displayName: 'GPT-4o', maxTokens: 4096, supportsStreaming: true },
  { id: 'gpt-4o-mini', provider: 'openai', name: 'gpt-4o-mini', displayName: 'GPT-4o Mini', maxTokens: 4096, supportsStreaming: true },
  { id: 'o3', provider: 'openai', name: 'o3', displayName: 'o3', maxTokens: 4096, supportsStreaming: true },
  { id: 'o3-mini', provider: 'openai', name: 'o3-mini', displayName: 'o3 Mini', maxTokens: 4096, supportsStreaming: true },
  // Google
  { id: 'gemini-2.5-pro', provider: 'google', name: 'gemini-2.5-pro', displayName: 'Gemini 2.5 Pro', maxTokens: 8192, supportsStreaming: true },
  { id: 'gemini-2.5-flash', provider: 'google', name: 'gemini-2.5-flash', displayName: 'Gemini 2.5 Flash', maxTokens: 8192, supportsStreaming: true },
  // Mistral
  { id: 'mistral-large-latest', provider: 'mistral', name: 'mistral-large-latest', displayName: 'Mistral Large', maxTokens: 4096, supportsStreaming: true },
  { id: 'mistral-medium-latest', provider: 'mistral', name: 'mistral-medium-latest', displayName: 'Mistral Medium', maxTokens: 4096, supportsStreaming: true },
  // Groq
  { id: 'llama-3.3-70b-versatile', provider: 'groq', name: 'llama-3.3-70b-versatile', displayName: 'Llama 3.3 70B (Groq)', maxTokens: 8192, supportsStreaming: true },
  { id: 'mixtral-8x7b-32768', provider: 'groq', name: 'mixtral-8x7b-32768', displayName: 'Mixtral 8x7B (Groq)', maxTokens: 8192, supportsStreaming: true },
];

const POSITION_LABELS: Record<string, string> = {
  proposition: 'Proposition',
  opposition: 'Opposition',
  housemaster: 'Housemaster',
};

/* ------- component ------- */

const SetupWizard: React.FC = () => {
  const [step, setStep] = useState(0);
  const [localModels, setLocalModels] = useState<ModelConfig[]>([]);
  const [loadingLocal, setLoadingLocal] = useState(false);
  const [preOpinion, setPreOpinion] = useState<OpinionValue | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<DebateFormat>('oxford-union');
  const [showMoreTopics, setShowMoreTopics] = useState(false);

  const setupTopic = useStore((s) => s.setupTopic);
  const setSetupTopic = useStore((s) => s.setSetupTopic);
  const setupDebaters = useStore((s) => s.setupDebaters);
  const updateSetupDebater = useStore((s) => s.updateSetupDebater);
  const personas = useStore((s) => s.personas);
  const settings = useStore((s) => s.settings);
  const setCurrentDebate = useStore((s) => s.setCurrentDebate);
  const setCurrentView = useStore((s) => s.setCurrentView);

  // Fetch Ollama and LM Studio models on mount
  const fetchLocalModels = useCallback(async () => {
    setLoadingLocal(true);
    const discovered: ModelConfig[] = [];

    // Ollama
    try {
      const resp = await fetch(`${settings.localModelEndpoint}/api/tags`, { signal: AbortSignal.timeout(3000) });
      if (resp.ok) {
        const data = await resp.json();
        for (const m of (data.models ?? [])) {
          const name = m.name ?? m.model ?? 'unknown';
          discovered.push({
            id: `ollama-${name}`,
            provider: 'ollama',
            name,
            displayName: `${name} (Ollama)`,
            maxTokens: 4096,
            supportsStreaming: true,
          });
        }
      }
    } catch {
      // Ollama not running — skip
    }

    // LM Studio
    try {
      const resp = await fetch(`${settings.lmStudioEndpoint}/models`, { signal: AbortSignal.timeout(3000) });
      if (resp.ok) {
        const data = await resp.json();
        for (const m of (data.data ?? [])) {
          const name = m.id ?? 'unknown';
          discovered.push({
            id: `lmstudio-${name}`,
            provider: 'lmstudio',
            name,
            displayName: `${name} (LM Studio)`,
            maxTokens: 4096,
            supportsStreaming: true,
          });
        }
      }
    } catch {
      // LM Studio not running — skip
    }

    setLocalModels(discovered);
    setLoadingLocal(false);
  }, [settings.localModelEndpoint, settings.lmStudioEndpoint]);

  useEffect(() => {
    fetchLocalModels();
  }, [fetchLocalModels]);

  // Merge cloud + local models
  const AVAILABLE_MODELS = useMemo(() => [...CLOUD_MODELS, ...localModels], [localModels]);

  // Check if all debaters use the same model (warn about lack of diversity)
  const allSameModel = useMemo(() => {
    if (setupDebaters.length < 2) return false;
    const firstModelId = setupDebaters[0]?.model?.id;
    return setupDebaters.every((d) => d.model?.id === firstModelId);
  }, [setupDebaters]);

  const canNext = useMemo(() => {
    if (step === 0) return setupTopic.trim().length > 5;
    if (step === 1) return setupDebaters.length >= 3 && setupDebaters.every((d) => d.name && d.model);
    if (step === 2) return true; // Review step
    if (step === 3) return preOpinion !== null; // Opinion poll step
    return true;
  }, [step, setupTopic, setupDebaters, preOpinion]);

  const handleStart = () => {
    const formatConfig: DebateFormatConfig = DEBATE_FORMATS[selectedFormat] ?? OXFORD_UNION_FORMAT;
    const formatInfo = FORMAT_OPTIONS.find((f) => f.value === selectedFormat);

    // Filter debaters based on format (Lincoln-Douglas doesn't need housemaster)
    const relevantDebaters = formatInfo?.needsHousemaster
      ? setupDebaters
      : setupDebaters.filter((d) => d.position !== 'housemaster');

    const finalDebaters: DebaterConfig[] = relevantDebaters.map((d) => ({
      ...d,
      id: d.id || uuidv4(),
      name: d.name || d.persona?.name || POSITION_LABELS[d.position] || 'Debater',
    }));

    const housemaster = finalDebaters.find((d) => d.position === 'housemaster');
    const housemasterId = housemaster?.id ?? '';

    const debate = {
      id: uuidv4(),
      topic: setupTopic,
      format: formatConfig,
      status: 'in-progress' as const,
      debaters: finalDebaters,
      turns: [],
      currentRound: 1,
      currentDebaterIndex: 0,
      currentPhase: formatConfig.turnSequence[0].phase,
      housemasterId,
      userPreOpinion: preOpinion ?? undefined,
      momentum: [],
      language: settings.language ?? 'en',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setCurrentDebate(debate);
    setCurrentView('debate');
  };

  /* ------- Randomize topic ------- */
  const handleRandomTopic = useCallback(() => {
    const allTopics = [...TOPIC_SUGGESTIONS, ...MORE_TOPICS];
    const random = allTopics[Math.floor(Math.random() * allTopics.length)];
    setSetupTopic(random);
  }, [setSetupTopic]);

  /* ------- Step 1: Topic ------- */
  const renderTopicStep = () => (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h2 className="mb-2 text-2xl font-bold text-gray-900 dark:text-gray-100">Choose a Topic & Format</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">Enter a debate topic, pick a suggestion, or generate a random one.</p>
      </div>

      {/* Format Selection */}
      <div>
        <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Debate Format</p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {FORMAT_OPTIONS.map((fmt) => (
            <button
              key={fmt.value}
              onClick={() => setSelectedFormat(fmt.value)}
              className={clsx(
                'rounded-xl border-2 px-4 py-3 text-left transition-all',
                selectedFormat === fmt.value
                  ? 'border-forge-500 bg-forge-50 dark:border-forge-500 dark:bg-forge-900/20'
                  : 'border-gray-200 hover:border-gray-300 dark:border-surface-dark-4 dark:hover:border-surface-dark-3',
              )}
            >
              <p className="font-semibold text-gray-900 dark:text-gray-100">{fmt.label}</p>
              <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{fmt.desc}</p>
              <Badge variant="info" size="sm">{fmt.turns} turns</Badge>
            </button>
          ))}
        </div>
      </div>

      {/* Topic Input */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Topic</p>
          <Button variant="ghost" size="sm" onClick={handleRandomTopic} icon={<RefreshCw className="h-3.5 w-3.5" />}>
            Random Topic
          </Button>
        </div>
        <textarea
          value={setupTopic}
          onChange={(e) => setSetupTopic(e.target.value)}
          placeholder="e.g., Should artificial intelligence be regulated by international law?"
          className={clsx(
            'block w-full rounded-xl border bg-white px-4 py-3 text-base text-gray-900 shadow-sm transition-colors',
            'placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-forge-500/30 focus:border-forge-500',
            'dark:bg-surface-dark-1 dark:text-gray-100 dark:border-surface-dark-4 dark:placeholder:text-gray-500',
            'border-gray-300 min-h-[80px] resize-none',
          )}
          rows={2}
        />
      </div>

      {/* Topic Suggestions */}
      <div>
        <div className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400">
          <Lightbulb className="h-4 w-4" />
          <span>Suggestions</span>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {TOPIC_SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => setSetupTopic(suggestion)}
              className={clsx(
                'rounded-lg border px-4 py-3 text-left text-sm transition-all',
                'hover:border-forge-400 hover:bg-forge-50 dark:hover:border-forge-600 dark:hover:bg-forge-900/20',
                setupTopic === suggestion
                  ? 'border-forge-500 bg-forge-50 text-forge-700 dark:border-forge-500 dark:bg-forge-900/30 dark:text-forge-300'
                  : 'border-gray-200 text-gray-700 dark:border-surface-dark-4 dark:text-gray-300',
              )}
            >
              {suggestion}
            </button>
          ))}
          {showMoreTopics && MORE_TOPICS.map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => setSetupTopic(suggestion)}
              className={clsx(
                'rounded-lg border px-4 py-3 text-left text-sm transition-all',
                'hover:border-forge-400 hover:bg-forge-50 dark:hover:border-forge-600 dark:hover:bg-forge-900/20',
                setupTopic === suggestion
                  ? 'border-forge-500 bg-forge-50 text-forge-700 dark:border-forge-500 dark:bg-forge-900/30 dark:text-forge-300'
                  : 'border-gray-200 text-gray-700 dark:border-surface-dark-4 dark:text-gray-300',
              )}
            >
              {suggestion}
            </button>
          ))}
        </div>
        {!showMoreTopics && (
          <button
            onClick={() => setShowMoreTopics(true)}
            className="mt-2 text-sm font-medium text-forge-600 hover:text-forge-700 dark:text-forge-400 dark:hover:text-forge-300"
          >
            Show more topics...
          </button>
        )}
      </div>
    </div>
  );

  /* ------- Step 2: Debaters ------- */
  const renderDebatersStep = () => (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="mb-2 text-2xl font-bold text-gray-900 dark:text-gray-100">Configure Debaters</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Assign a model and persona to each participant. Using different models creates a more dynamic multi-agent debate.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {localModels.length > 0 && (
            <Badge variant="success">{localModels.length} local model{localModels.length > 1 ? 's' : ''}</Badge>
          )}
          <Button variant="ghost" size="sm" onClick={fetchLocalModels} loading={loadingLocal} icon={<RefreshCw className="h-4 w-4" />}>
            Scan Local
          </Button>
        </div>
      </div>

      {/* Model diversity warning */}
      {allSameModel && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-700 dark:bg-amber-900/20">
          <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
          <p className="text-sm text-amber-700 dark:text-amber-300">
            All debaters use the same model. For a more dynamic debate, try assigning different models to each participant so each agent has its own reasoning style.
          </p>
        </div>
      )}

      <div className="space-y-4">
        {setupDebaters.map((debater) => (
          <Card key={debater.id} className={clsx(
            'space-y-4',
            debater.position === 'housemaster' && 'ring-1 ring-amber-300 dark:ring-amber-700',
          )}>
            <div className="mb-2 flex items-center gap-2">
              <Badge variant={
                debater.position === 'proposition' ? 'success'
                : debater.position === 'opposition' ? 'error'
                : 'warning'
              }>
                {POSITION_LABELS[debater.position] ?? debater.position}
              </Badge>
              {debater.position === 'housemaster' && (
                <span className="text-xs text-gray-500 dark:text-gray-400">Neutral moderator & judge</span>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Input
                label="Name"
                value={debater.name}
                onChange={(e) => updateSetupDebater(debater.id, { name: e.target.value })}
                placeholder={POSITION_LABELS[debater.position] ?? 'Debater name'}
              />

              <Select
                label="Model"
                options={AVAILABLE_MODELS.map((m) => ({ value: m.id, label: m.displayName }))}
                value={debater.model?.id ?? AVAILABLE_MODELS[0].id}
                onChange={(e) => {
                  const model = AVAILABLE_MODELS.find((m) => m.id === e.target.value);
                  if (model) updateSetupDebater(debater.id, { model, isLocal: model.provider === 'ollama' || model.provider === 'lmstudio' });
                }}
              />

              <Select
                label="Persona"
                options={personas.map((p) => ({ value: p.id, label: p.name }))}
                value={debater.persona?.id ?? personas[0]?.id ?? ''}
                onChange={(e) => {
                  const persona = personas.find((p) => p.id === e.target.value);
                  if (persona) updateSetupDebater(debater.id, { persona });
                }}
                placeholder={personas.length === 0 ? 'No personas available' : undefined}
              />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );

  /* ------- Step 3: Review ------- */
  const renderReviewStep = () => (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h2 className="mb-2 text-2xl font-bold text-gray-900 dark:text-gray-100">Review & Start</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">Confirm your debate settings before starting.</p>
      </div>

      <Card className="space-y-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Topic</p>
          <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-gray-100">{setupTopic}</p>
        </div>

        <div className="h-px bg-gray-200 dark:bg-surface-dark-3" />

        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Format</p>
          <div className="mt-1 flex items-center gap-2">
            <span className="font-semibold text-gray-900 dark:text-gray-100">{DEBATE_FORMATS[selectedFormat]?.name ?? 'Oxford Union'}</span>
            <Badge variant="info">{DEBATE_FORMATS[selectedFormat]?.totalTurns ?? 10} turns</Badge>
          </div>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{DEBATE_FORMATS[selectedFormat]?.description ?? ''}</p>
        </div>

        <div className="h-px bg-gray-200 dark:bg-surface-dark-3" />

        <div>
          <p className="mb-3 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Debaters
          </p>
          <div className="space-y-3">
            {setupDebaters.map((d) => (
              <div key={d.id} className={clsx(
                'flex items-center gap-3 rounded-lg border p-3',
                d.position === 'housemaster'
                  ? 'border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-900/10'
                  : 'border-gray-200 dark:border-surface-dark-3',
              )}>
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white"
                  style={{ backgroundColor: d.persona?.avatar_color ?? (d.position === 'housemaster' ? '#D97706' : '#6b7280') }}
                >
                  {(d.name ?? 'D')[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-gray-100">{d.name}</p>
                  <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <span>{d.model?.displayName ?? 'No model'}</span>
                    <span className="text-gray-300 dark:text-surface-dark-4">|</span>
                    <span>{d.persona?.name ?? 'No persona'}</span>
                  </div>
                </div>
                <Badge variant={
                  d.position === 'proposition' ? 'success'
                  : d.position === 'opposition' ? 'error'
                  : 'warning'
                }>
                  {POSITION_LABELS[d.position] ?? d.position}
                </Badge>
              </div>
            ))}

            {/* Model diversity indicator */}
            {allSameModel && (
              <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 dark:bg-amber-900/20">
                <Lightbulb className="h-4 w-4 text-amber-500" />
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  All debaters use the same model. Different models produce more varied arguments.
                </p>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );

  /* ------- Step 4: Pre-Debate Opinion Poll ------- */
  const renderOpinionStep = () => (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="text-center">
        <h2 className="mb-2 text-2xl font-bold text-gray-900 dark:text-gray-100">Before We Begin</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Do you support this motion? We will ask you again after the debate to see if your opinion shifted.
        </p>
      </div>

      <Card className="space-y-4">
        <div className="text-center">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">The Motion</p>
          <p className="mt-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
            {setupTopic}
          </p>
        </div>

        <div className="h-px bg-gray-200 dark:bg-surface-dark-3" />

        <div>
          <p className="mb-4 text-center text-sm font-medium text-gray-700 dark:text-gray-300">
            What is your position?
          </p>
          <div className="grid grid-cols-3 gap-3">
            {OPINION_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => setPreOpinion(option.value)}
                className={clsx(
                  'flex flex-col items-center gap-2 rounded-xl border-2 px-4 py-5 text-center transition-all',
                  preOpinion === option.value
                    ? option.activeColor
                    : option.color,
                )}
              >
                <span className="text-3xl">{option.emoji}</span>
                <span className="text-sm font-semibold">{option.label}</span>
              </button>
            ))}
          </div>
        </div>

        {preOpinion && (
          <div className="mt-2 rounded-lg bg-gray-50 p-3 text-center text-sm text-gray-600 dark:bg-surface-dark-2 dark:text-gray-400">
            Your pre-debate position: <span className="font-semibold capitalize">{preOpinion}</span>
          </div>
        )}
      </Card>
    </div>
  );

  const steps = [renderTopicStep, renderDebatersStep, renderReviewStep, renderOpinionStep];

  return (
    <div className="flex h-full flex-col">
      {/* Progress */}
      <div className="border-b border-gray-200 bg-white px-6 py-4 dark:border-surface-dark-3 dark:bg-surface-dark-0">
        <div className="mx-auto max-w-4xl">
          <div className="mb-3 flex items-center justify-between text-sm">
            {STEP_LABELS.map((label, i) => (
              <button
                key={label}
                onClick={() => { if (i < step) setStep(i); }}
                className={clsx(
                  'flex items-center gap-2 font-medium transition-colors',
                  i === step
                    ? 'text-forge-600 dark:text-forge-400'
                    : i < step
                      ? 'text-gray-700 dark:text-gray-300 cursor-pointer hover:text-forge-500'
                      : 'text-gray-400 dark:text-gray-500',
                )}
              >
                <span
                  className={clsx(
                    'flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold',
                    i === step
                      ? 'bg-forge-600 text-white'
                      : i < step
                        ? 'bg-forge-100 text-forge-700 dark:bg-forge-900/40 dark:text-forge-300'
                        : 'bg-gray-200 text-gray-500 dark:bg-surface-dark-3 dark:text-gray-500',
                  )}
                >
                  {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
                </span>
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>
          <ProgressBar value={((step + 1) / STEP_LABELS.length) * 100} />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto px-6 py-8">
        {steps[step]()}
      </div>

      {/* Bottom actions */}
      <div className="border-t border-gray-200 bg-white px-6 py-4 dark:border-surface-dark-3 dark:bg-surface-dark-0">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            icon={<ChevronLeft className="h-4 w-4" />}
          >
            Back
          </Button>

          {step < STEP_LABELS.length - 1 ? (
            <Button
              onClick={() => setStep((s) => Math.min(STEP_LABELS.length - 1, s + 1))}
              disabled={!canNext}
              icon={<ChevronRight className="h-4 w-4" />}
            >
              Next
            </Button>
          ) : (
            <Button
              onClick={handleStart}
              disabled={!canNext}
              icon={<Play className="h-4 w-4" />}
            >
              Start Debate
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SetupWizard;
