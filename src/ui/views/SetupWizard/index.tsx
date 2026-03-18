import React, { useState, useMemo, useEffect, useCallback } from 'react';
import clsx from 'clsx';
import { v4 as uuidv4 } from 'uuid';
import {
  ChevronRight, ChevronLeft, Play, Lightbulb,
  Check, RefreshCw, Shuffle,
} from 'lucide-react';
import { useStore } from '../../store';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Select } from '../../components/Select';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { ProgressBar } from '../../components/ProgressBar';
import { OXFORD_UNION_FORMAT } from '../../../core/debate_engine/formats';
import type { DebaterConfig, ModelConfig, Persona, OpinionValue } from '../../../types';

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

const CLOUD_MODELS: ModelConfig[] = [
  { id: 'claude-sonnet-4-20250514', provider: 'anthropic', name: 'claude-sonnet-4-20250514', displayName: 'Claude Sonnet 4', maxTokens: 8192, supportsStreaming: true },
  { id: 'claude-3-5-sonnet-20241022', provider: 'anthropic', name: 'claude-3-5-sonnet-20241022', displayName: 'Claude 3.5 Sonnet', maxTokens: 8192, supportsStreaming: true },
  { id: 'gpt-4o', provider: 'openai', name: 'gpt-4o', displayName: 'GPT-4o', maxTokens: 4096, supportsStreaming: true },
  { id: 'gpt-4-turbo', provider: 'openai', name: 'gpt-4-turbo', displayName: 'GPT-4 Turbo', maxTokens: 4096, supportsStreaming: true },
  { id: 'gemini-pro', provider: 'google', name: 'gemini-pro', displayName: 'Gemini Pro', maxTokens: 8192, supportsStreaming: true },
  { id: 'mistral-large-latest', provider: 'mistral', name: 'mistral-large-latest', displayName: 'Mistral Large', maxTokens: 4096, supportsStreaming: true },
  { id: 'llama3-groq-70b-8192-tool-use-preview', provider: 'groq', name: 'llama3-groq-70b-8192-tool-use-preview', displayName: 'Llama 3 70B (Groq)', maxTokens: 8192, supportsStreaming: true },
];

const POSITION_LABELS: Record<string, string> = {
  proposition: 'Proposition',
  opposition: 'Opposition',
};

/* ------- component ------- */

const SetupWizard: React.FC = () => {
  const [step, setStep] = useState(0);
  const [localModels, setLocalModels] = useState<ModelConfig[]>([]);
  const [loadingLocal, setLoadingLocal] = useState(false);
  const [preOpinion, setPreOpinion] = useState<OpinionValue | null>(null);

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

  const canNext = useMemo(() => {
    if (step === 0) return setupTopic.trim().length > 5;
    if (step === 1) return setupDebaters.length >= 2 && setupDebaters.every((d) => d.name && d.model);
    if (step === 2) return true; // Review step
    if (step === 3) return preOpinion !== null; // Opinion poll step
    return true;
  }, [step, setupTopic, setupDebaters, preOpinion]);

  const handleStart = () => {
    // Randomly select a model for the Housemaster from all available models
    const housemasterModel = AVAILABLE_MODELS[Math.floor(Math.random() * AVAILABLE_MODELS.length)];

    // Pick a random persona for the Housemaster
    const housemasterPersona: Persona = personas.length > 0
      ? personas[Math.floor(Math.random() * personas.length)]
      : {
          id: 'default-housemaster',
          name: 'The Housemaster',
          tagline: 'Order in the house!',
          background: 'An experienced parliamentary moderator and debate adjudicator.',
          expertise: ['moderation', 'parliamentary procedure', 'rhetoric', 'critical analysis'],
          rhetorical_style: 'Authoritative yet fair. Maintains decorum while probing both sides equally.',
          ideological_leanings: 'Strictly neutral — focused on fairness and quality of argument.',
          argumentation_preferences: {
            evidence_weight: 'heavy',
            emotional_appeals: 'minimal',
            concession_willingness: 'moderate',
            humor: 'Wry parliamentary wit.',
          },
          debate_behavior: {
            opening_strategy: 'Set the stage clearly, explain the motion, and establish ground rules.',
            rebuttal_strategy: 'Ask pointed questions to both sides, challenging weak points impartially.',
            closing_strategy: 'Weigh all arguments presented and deliver a reasoned verdict.',
          },
          avatar_color: '#D97706',
        };

    // Create the Housemaster debater config
    const housemasterId = uuidv4();
    const housemasterDebater: DebaterConfig = {
      id: housemasterId,
      name: 'Housemaster',
      model: housemasterModel,
      persona: housemasterPersona,
      position: 'housemaster',
      isLocal: housemasterModel.provider === 'ollama' || housemasterModel.provider === 'lmstudio',
    };

    // Auto-assign debater names from their persona if not customized
    const finalDebaters = setupDebaters.map((d) => ({
      ...d,
      name: d.name || d.persona?.name || (d.position === 'proposition' ? 'Proposition' : 'Opposition'),
    }));

    // Build the full debaters array: user-configured proposition + opposition, plus the auto-assigned housemaster
    const allDebaters: DebaterConfig[] = [...finalDebaters, housemasterDebater];

    const debate = {
      id: uuidv4(),
      topic: setupTopic,
      format: OXFORD_UNION_FORMAT,
      status: 'in-progress' as const,
      debaters: allDebaters,
      turns: [],
      currentRound: 1,
      currentDebaterIndex: 0,
      currentPhase: OXFORD_UNION_FORMAT.turnSequence[0].phase,
      housemasterId,
      userPreOpinion: preOpinion ?? undefined,
      momentum: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setCurrentDebate(debate);
    setCurrentView('debate');
  };

  /* ------- Step 1: Topic ------- */
  const renderTopicStep = () => (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h2 className="mb-2 text-2xl font-bold text-gray-900 dark:text-gray-100">Choose a Topic</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">Enter a debate topic or question, or pick one of our suggestions.</p>
      </div>

      <textarea
        value={setupTopic}
        onChange={(e) => setSetupTopic(e.target.value)}
        placeholder="e.g., Should artificial intelligence be regulated by international law?"
        className={clsx(
          'block w-full rounded-xl border bg-white px-4 py-3 text-base text-gray-900 shadow-sm transition-colors',
          'placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-forge-500/30 focus:border-forge-500',
          'dark:bg-surface-dark-1 dark:text-gray-100 dark:border-surface-dark-4 dark:placeholder:text-gray-500',
          'border-gray-300 min-h-[100px] resize-none',
        )}
        rows={3}
      />

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
        </div>
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
            Assign a model and persona to the Proposition and Opposition. A Housemaster will be randomly assigned when the debate starts.
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

      <div className="space-y-4">
        {setupDebaters.map((debater) => (
          <Card key={debater.id} className="space-y-4">
            <div className="mb-2 flex items-center gap-2">
              <Badge variant={debater.position === 'proposition' ? 'success' : 'error'}>
                {POSITION_LABELS[debater.position] ?? debater.position}
              </Badge>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Input
                label="Name"
                value={debater.name}
                onChange={(e) => updateSetupDebater(debater.id, { name: e.target.value })}
                placeholder="Debater name"
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
            <span className="font-semibold text-gray-900 dark:text-gray-100">Oxford Union</span>
            <Badge variant="info">{OXFORD_UNION_FORMAT.totalTurns} turns</Badge>
          </div>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{OXFORD_UNION_FORMAT.description}</p>
        </div>

        <div className="h-px bg-gray-200 dark:bg-surface-dark-3" />

        <div>
          <p className="mb-3 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Debaters
          </p>
          <div className="space-y-3">
            {setupDebaters.map((d) => (
              <div key={d.id} className="flex items-center gap-3 rounded-lg border border-gray-200 p-3 dark:border-surface-dark-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white"
                  style={{ backgroundColor: d.persona?.avatar_color ?? '#6b7280' }}
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
                <Badge variant={d.position === 'proposition' ? 'success' : 'error'}>
                  {POSITION_LABELS[d.position] ?? d.position}
                </Badge>
              </div>
            ))}

            {/* Housemaster auto-assignment notice */}
            <div className="flex items-center gap-3 rounded-lg border border-dashed border-amber-300 bg-amber-50 p-3 dark:border-amber-700 dark:bg-amber-900/20">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500 text-sm font-bold text-white">
                <Shuffle className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 dark:text-gray-100">Housemaster</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  A random model and persona will be assigned when the debate starts
                </p>
              </div>
              <Badge variant="warning">Auto-assigned</Badge>
            </div>
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
