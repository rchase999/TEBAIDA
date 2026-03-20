import React from 'react';
import clsx from 'clsx';
import {
  Brain, Scale, Lightbulb, Globe, Cpu, Heart,
  Shield, Zap, GraduationCap, Landmark,
} from 'lucide-react';

export interface QuickTemplate {
  id: string;
  title: string;
  topic: string;
  category: string;
  icon: React.FC<{ className?: string }>;
  color: string;
  bgColor: string;
}

export const QUICK_TEMPLATES: QuickTemplate[] = [
  {
    id: 'ai-consciousness',
    title: 'AI Consciousness',
    topic: 'Can artificial intelligence ever achieve true consciousness, or will it always be a sophisticated simulation?',
    category: 'Technology',
    icon: Brain,
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
  },
  {
    id: 'free-speech',
    title: 'Free Speech Limits',
    topic: 'Should social media platforms have the right to moderate content, or does this violate free speech principles?',
    category: 'Society',
    icon: Scale,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
  },
  {
    id: 'ubi',
    title: 'Universal Basic Income',
    topic: 'Is universal basic income a viable solution to technological unemployment, or would it create perverse incentives?',
    category: 'Economics',
    icon: Landmark,
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
  },
  {
    id: 'space-colonization',
    title: 'Mars Colony',
    topic: 'Should humanity prioritize colonizing Mars, or focus all resources on solving problems on Earth first?',
    category: 'Science',
    icon: Globe,
    color: 'text-cyan-600 dark:text-cyan-400',
    bgColor: 'bg-cyan-100 dark:bg-cyan-900/30',
  },
  {
    id: 'gene-editing',
    title: 'Designer Babies',
    topic: 'Should CRISPR gene editing be allowed for enhancing human traits beyond disease prevention?',
    category: 'Ethics',
    icon: Heart,
    color: 'text-rose-600 dark:text-rose-400',
    bgColor: 'bg-rose-100 dark:bg-rose-900/30',
  },
  {
    id: 'ai-regulation',
    title: 'AI Regulation',
    topic: 'Should governments impose strict regulations on AI development, or would this stifle innovation and benefit competitors?',
    category: 'Policy',
    icon: Shield,
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
  },
  {
    id: 'nuclear-energy',
    title: 'Nuclear Renaissance',
    topic: 'Is nuclear energy the most practical solution to climate change, despite its risks and waste challenges?',
    category: 'Environment',
    icon: Zap,
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
  },
  {
    id: 'education-ai',
    title: 'AI in Education',
    topic: 'Should AI tutors replace traditional teachers, or does human instruction provide irreplaceable value?',
    category: 'Education',
    icon: GraduationCap,
    color: 'text-indigo-600 dark:text-indigo-400',
    bgColor: 'bg-indigo-100 dark:bg-indigo-900/30',
  },
  {
    id: 'cryptocurrency',
    title: 'Crypto Future',
    topic: 'Will decentralized cryptocurrencies eventually replace traditional banking, or are they a speculative bubble?',
    category: 'Finance',
    icon: Cpu,
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
  },
  {
    id: 'philosophy-free-will',
    title: 'Free Will Illusion',
    topic: 'Is free will an illusion given what neuroscience reveals about deterministic brain processes?',
    category: 'Philosophy',
    icon: Lightbulb,
    color: 'text-yellow-600 dark:text-yellow-400',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
  },
];

export interface DebateQuickTemplatesProps {
  onSelect: (template: QuickTemplate) => void;
  className?: string;
}

export const DebateQuickTemplates: React.FC<DebateQuickTemplatesProps> = ({ onSelect, className }) => {
  return (
    <div className={clsx('grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5', className)}>
      {QUICK_TEMPLATES.map((template) => {
        const Icon = template.icon;
        return (
          <button
            key={template.id}
            onClick={() => onSelect(template)}
            className={clsx(
              'group flex flex-col items-center gap-2 rounded-xl border border-gray-100 bg-white p-3 text-center',
              'transition-all duration-200 hover:border-gray-200 hover:shadow-md hover:-translate-y-0.5',
              'dark:border-surface-dark-3 dark:bg-surface-dark-1 dark:hover:border-surface-dark-4',
            )}
          >
            <div className={clsx('flex h-10 w-10 items-center justify-center rounded-xl transition-transform group-hover:scale-110', template.bgColor)}>
              <Icon className={clsx('h-5 w-5', template.color)} />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-900 dark:text-gray-100">{template.title}</p>
              <p className="text-[10px] text-gray-400 dark:text-gray-500">{template.category}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default DebateQuickTemplates;
