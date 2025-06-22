'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { AlertCircle, CheckCircle, Info, XCircle, X } from 'lucide-react';

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  title?: string;
  children: React.ReactNode;
  onClose?: () => void;
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = 'default', title, children, onClose, ...props }, ref) => {
    const variants = {
      default: 'bg-gray-50 border-gray-200 text-gray-800',
      success: 'bg-green-50 border-green-200 text-green-800',
      warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      error: 'bg-red-50 border-red-200 text-red-800',
      info: 'bg-blue-50 border-blue-200 text-blue-800',
    };
    
    const icons = {
      default: <Info className="h-4 w-4" />,
      success: <CheckCircle className="h-4 w-4" />,
      warning: <AlertCircle className="h-4 w-4" />,
      error: <XCircle className="h-4 w-4" />,
      info: <Info className="h-4 w-4" />,
    };
    
    return (
      <div
        ref={ref}
        className={cn(
          'relative rounded-lg border p-4',
          variants[variant],
          className
        )}
        {...props}
      >
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            {icons[variant]}
          </div>
          <div className="flex-1">
            {title && (
              <h4 className="text-sm font-medium mb-1">
                {title}
              </h4>
            )}
            <div className="text-sm">
              {children}
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="flex-shrink-0 rounded-md p-1 hover:bg-black/5 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    );
  }
);

Alert.displayName = 'Alert';

export { Alert };
export type { AlertProps }; 