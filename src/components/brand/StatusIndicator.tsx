import React from 'react';
import { cn } from '@/lib/utils';

interface StatusIndicatorProps extends React.HTMLAttributes<HTMLDivElement> {
  status: 'online' | 'offline' | 'away' | 'busy' | 'connecting' | 'error';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  label?: string;
}

const StatusIndicator = React.forwardRef<HTMLDivElement, StatusIndicatorProps>(
  ({ className, status, size = 'md', showLabel = false, label, ...props }, ref) => {
    const statusConfig = {
      online: {
        color: 'bg-green-500',
        label: 'Online',
        textColor: 'text-green-700',
      },
      offline: {
        color: 'bg-gray-400',
        label: 'Offline',
        textColor: 'text-gray-600',
      },
      away: {
        color: 'bg-yellow-500',
        label: 'Ausente',
        textColor: 'text-yellow-700',
      },
      busy: {
        color: 'bg-red-500',
        label: 'Ocupado',
        textColor: 'text-red-700',
      },
      connecting: {
        color: 'bg-brand-green-light',
        label: 'Conectando',
        textColor: 'text-brand-green-dark',
      },
      error: {
        color: 'bg-red-500',
        label: 'Erro',
        textColor: 'text-red-700',
      },
    };
    
    const sizes = {
      sm: 'w-2 h-2',
      md: 'w-3 h-3',
      lg: 'w-4 h-4',
    };
    
    const config = statusConfig[status];
    
    return (
      <div
        ref={ref}
        className={cn('flex items-center gap-2', className)}
        {...props}
      >
        <div
          className={cn(
            'rounded-full border-2 border-white shadow-sm',
            sizes[size],
            config.color
          )}
        />
        {showLabel && (
          <span className={cn('text-sm font-medium', config.textColor)}>
            {label || config.label}
          </span>
        )}
      </div>
    );
  }
);

StatusIndicator.displayName = 'StatusIndicator';

export { StatusIndicator };
export type { StatusIndicatorProps }; 