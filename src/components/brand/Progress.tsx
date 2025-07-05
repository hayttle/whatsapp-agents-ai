import React from 'react';
import { cn } from '@/lib/utils';

interface ProgressProps {
  value: number;
  max?: number;
  className?: string;
  progressClassName?: string;
}

export const Progress: React.FC<ProgressProps> = ({
  value,
  max = 100,
  className = '',
  progressClassName = '',
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div className={cn('w-full bg-gray-200 rounded-full overflow-hidden', className)}>
      <div
        className={cn(
          'h-full transition-all duration-300 ease-in-out',
          progressClassName || 'bg-blue-500'
        )}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}; 