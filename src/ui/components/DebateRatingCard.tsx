import React, { useState } from 'react';
import clsx from 'clsx';
import { Star, MessageSquare, Send, Check } from 'lucide-react';
import { Card } from './Card';

export interface DebateRatingCardProps {
  debateId: string;
  onRate?: (rating: number, comment: string) => void;
  className?: string;
}

/**
 * Post-debate satisfaction card where users can rate the debate quality
 * and leave optional feedback about the AI models' performance.
 */
export const DebateRatingCard: React.FC<DebateRatingCardProps> = ({
  debateId,
  onRate,
  className,
}) => {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    onRate?.(rating, comment);
    setSubmitted(true);
  };

  const displayRating = hoveredRating || rating;

  const ratingLabels = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'];

  if (submitted) {
    return (
      <Card className={clsx('text-center py-6', className)}>
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
          <Check className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
        </div>
        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Thanks for your feedback!</p>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Your rating helps improve future debates.</p>
      </Card>
    );
  }

  return (
    <Card className={clsx('', className)}>
      <div className="text-center mb-4">
        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">How was this debate?</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">Rate the quality of the AI arguments</p>
      </div>

      {/* Star rating */}
      <div className="flex items-center justify-center gap-1 mb-2">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            onMouseEnter={() => setHoveredRating(value)}
            onMouseLeave={() => setHoveredRating(0)}
            onClick={() => setRating(value)}
            className="p-0.5 transition-transform hover:scale-110"
          >
            <Star
              className={clsx(
                'h-7 w-7 transition-colors',
                value <= displayRating
                  ? 'fill-amber-400 text-amber-400'
                  : 'text-gray-300 dark:text-gray-600',
              )}
            />
          </button>
        ))}
      </div>

      {displayRating > 0 && (
        <p className="text-center text-xs font-medium text-amber-600 dark:text-amber-400 mb-3">
          {ratingLabels[displayRating]}
        </p>
      )}

      {/* Optional comment */}
      {rating > 0 && (
        <div className="space-y-2 animate-fade-in">
          <div className="relative">
            <MessageSquare className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Any thoughts on the debate? (optional)"
              rows={2}
              className="w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 py-2 text-xs text-gray-900 placeholder:text-gray-400 focus:border-forge-500 focus:outline-none focus:ring-2 focus:ring-forge-500/20 resize-none dark:border-surface-dark-3 dark:bg-surface-dark-2 dark:text-gray-100 dark:placeholder:text-gray-500"
            />
          </div>
          <button
            onClick={handleSubmit}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-forge-600 py-2 text-xs font-semibold text-white transition-colors hover:bg-forge-700"
          >
            <Send className="h-3 w-3" /> Submit Rating
          </button>
        </div>
      )}
    </Card>
  );
};

export default DebateRatingCard;
