'use client';

import { Star } from 'lucide-react';
import { useState } from 'react';

interface StarRatingProps {
  value: number;
  onChange?: (rating: number) => void;
  maxStars?: number;
  size?: 'sm' | 'md' | 'lg';
  readonly?: boolean;
  showLabel?: boolean;
}

export function StarRating({
  value,
  onChange,
  maxStars = 5,
  size = 'md',
  readonly = false,
  showLabel = false,
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState(0);

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const handleClick = (rating: number) => {
    if (!readonly && onChange) {
      // Se clicar na mesma estrela, remove a nota
      onChange(value === rating ? 0 : rating);
    }
  };

  const handleMouseEnter = (rating: number) => {
    if (!readonly) {
      setHoverRating(rating);
    }
  };

  const handleMouseLeave = () => {
    if (!readonly) {
      setHoverRating(0);
    }
  };

  const displayRating = hoverRating || value;

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1">
        {Array.from({ length: maxStars }).map((_, index) => {
          const starValue = index + 1;
          const isFilled = starValue <= displayRating;
          const isHovered = starValue <= hoverRating;

          return (
            <button
              key={index}
              type="button"
              onClick={() => handleClick(starValue)}
              onMouseEnter={() => handleMouseEnter(starValue)}
              onMouseLeave={handleMouseLeave}
              disabled={readonly}
              className={`
                transition-all duration-150
                ${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'}
                ${isHovered ? 'scale-110' : ''}
              `}
              aria-label={`${starValue} ${starValue === 1 ? 'estrela' : 'estrelas'}`}
            >
              <Star
                className={`
                  ${sizeClasses[size]}
                  transition-all duration-150
                  ${
                    isFilled
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-zinc-600 fill-transparent'
                  }
                  ${!readonly && !isFilled ? 'hover:text-yellow-400/50' : ''}
                `}
              />
            </button>
          );
        })}
      </div>
      {showLabel && (
        <span className="text-sm text-zinc-400 min-w-[3rem]">
          {value > 0 ? `${value}/5` : 'Sem nota'}
        </span>
      )}
    </div>
  );
}
