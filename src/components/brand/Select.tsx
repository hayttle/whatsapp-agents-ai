'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, helperText, leftIcon, rightIcon, id, children, ...props }, ref) => {
    const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;
    
    return (
      <div className="w-full">
        {label && (
          <label 
            htmlFor={selectId}
            className="block text-sm font-medium text-brand-gray-dark mb-2"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <div className="text-gray-400">
                {leftIcon}
              </div>
            </div>
          )}
          <select
            id={selectId}
            ref={ref}
            className={cn(
              'block w-full rounded-md border border-gray-300 px-3 py-2 text-sm transition-colors',
              'focus:border-brand-green-light focus:outline-none focus:ring-1 focus:ring-brand-green-light',
              'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed',
              error && 'border-red-300 focus:border-red-500 focus:ring-red-500',
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              className
            )}
            {...props}
          >
            {children}
          </select>
          {rightIcon && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <div className="text-gray-400">
                {rightIcon}
              </div>
            </div>
          )}
        </div>
        {error && (
          <p className="mt-1 text-sm text-red-600">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p className="mt-1 text-sm text-gray-500">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

export { Select };
export type { SelectProps }; 