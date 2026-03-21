import React, { useMemo } from 'react';
import clsx from 'clsx';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface QuoteOfTheDayProps {
  /** Compact single-line display mode. */
  compact?: boolean;
  /** Optional className override. */
  className?: string;
}

interface Quote {
  text: string;
  author: string;
}

// ---------------------------------------------------------------------------
// Quote bank — 30 quotes on debate, logic & critical thinking
// ---------------------------------------------------------------------------

const QUOTES: Quote[] = [
  { text: 'It is the mark of an educated mind to be able to entertain a thought without accepting it.', author: 'Aristotle' },
  { text: 'The unexamined life is not worth living.', author: 'Socrates' },
  { text: 'I disapprove of what you say, but I will defend to the death your right to say it.', author: 'Voltaire' },
  { text: 'That which can be asserted without evidence, can be dismissed without evidence.', author: 'Christopher Hitchens' },
  { text: 'Extraordinary claims require extraordinary evidence.', author: 'Carl Sagan' },
  { text: 'The ultimate measure of a man is not where he stands in moments of comfort, but where he stands at times of challenge and controversy.', author: 'Martin Luther King Jr.' },
  { text: 'The whole problem with the world is that fools and fanatics are always so certain of themselves, and wiser people so full of doubts.', author: 'Bertrand Russell' },
  { text: 'He who knows only his own side of the case knows little of that.', author: 'John Stuart Mill' },
  { text: 'In all debates, let truth be thy aim, not victory, or an unjust interest.', author: 'William Penn' },
  { text: 'The best way to show that a stick is crooked is not to argue about it or to spend time denouncing it, but to lay a straight stick alongside it.', author: 'D.L. Moody' },
  { text: 'Think for yourself and let others enjoy the privilege of doing so too.', author: 'Voltaire' },
  { text: 'The aim of argument, or of discussion, should not be victory, but progress.', author: 'Joseph Joubert' },
  { text: 'Doubt is not a pleasant condition, but certainty is absurd.', author: 'Voltaire' },
  { text: 'To argue with a person who has renounced the use of reason is like administering medicine to the dead.', author: 'Thomas Paine' },
  { text: 'If you would be a real seeker after truth, it is necessary that at least once in your life you doubt, as far as possible, all things.', author: 'Rene Descartes' },
  { text: 'The only true wisdom is in knowing you know nothing.', author: 'Socrates' },
  { text: 'Where there is shouting, there is no true knowledge.', author: 'Leonardo da Vinci' },
  { text: 'I think we ought always to entertain our opinions with some measure of doubt.', author: 'Bertrand Russell' },
  { text: 'Discussion is an exchange of knowledge; argument is an exchange of ignorance.', author: 'Robert Quillen' },
  { text: 'Strong minds discuss ideas, average minds discuss events, weak minds discuss people.', author: 'Socrates' },
  { text: 'The most courageous act is still to think for yourself. Aloud.', author: 'Coco Chanel' },
  { text: 'It is not enough to have a good mind; the main thing is to use it well.', author: 'Rene Descartes' },
  { text: 'Science is a way of thinking much more than it is a body of knowledge.', author: 'Carl Sagan' },
  { text: 'The measure of intelligence is the ability to change.', author: 'Albert Einstein' },
  { text: 'Reason is not automatic. Those who deny it cannot be conquered by it.', author: 'Ayn Rand' },
  { text: 'Every great advance in natural knowledge has involved the absolute rejection of authority.', author: 'Thomas Huxley' },
  { text: 'One of the penalties for refusing to participate in politics is that you end up being governed by your inferiors.', author: 'Plato' },
  { text: 'The essence of the independent mind lies not in what it thinks, but in how it thinks.', author: 'Christopher Hitchens' },
  { text: 'We can easily forgive a child who is afraid of the dark; the real tragedy of life is when men are afraid of the light.', author: 'Plato' },
  { text: 'All opinions are not equal. Some are a very great deal more robust, sophisticated, and well supported in logic and argument than others.', author: 'Douglas Adams' },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Returns the day-of-year (1-366) for a given Date. */
function dayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const QuoteOfTheDay: React.FC<QuoteOfTheDayProps> = ({
  compact = false,
  className,
}) => {
  const quote = useMemo(() => {
    const index = dayOfYear(new Date()) % QUOTES.length;
    return QUOTES[index];
  }, []);

  // ---- Compact (single-line) variant ----
  if (compact) {
    return (
      <div
        className={clsx(
          'flex items-center gap-2 truncate text-sm italic',
          'text-gray-500 dark:text-gray-400',
          className,
        )}
      >
        <span className="select-none font-serif text-lg leading-none text-forge-400 dark:text-forge-500">
          &ldquo;
        </span>
        <span className="truncate">{quote.text}</span>
        <span className="whitespace-nowrap font-medium not-italic">
          &mdash;&nbsp;{quote.author}
        </span>
      </div>
    );
  }

  // ---- Default (block) variant ----
  return (
    <div
      className={clsx(
        'relative border-l-4 border-forge-400 pl-5 dark:border-forge-600',
        className,
      )}
    >
      {/* Decorative quotation mark */}
      <span
        aria-hidden="true"
        className="absolute -left-1 -top-4 select-none font-serif text-5xl leading-none text-forge-300/50 dark:text-forge-600/40"
      >
        &ldquo;
      </span>

      {/* Quote text */}
      <p className="text-base italic leading-relaxed text-gray-600 dark:text-gray-300">
        {quote.text}
      </p>

      {/* Attribution */}
      <p className="mt-2 text-sm font-medium text-gray-500 dark:text-gray-400">
        &mdash;&nbsp;{quote.author}
      </p>
    </div>
  );
};

export default QuoteOfTheDay;
