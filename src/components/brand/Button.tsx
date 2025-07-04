'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'warning' | 'add' | 'iconDestructive';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  leftIcon?: React.ReactNode;
  children: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading = false, leftIcon, children, disabled, ...props }, ref) => {
    const baseClasses = 'inline-flex items-center justify-center font-semibold transition-all duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed';

    const variants = {
      primary: 'border-2 border-brand-green-light bg-brand-green-light hover:bg-brand-green-medium text-white focus:ring-brand-green-light shadow-sm',
      secondary: 'border-2 border-brand-green-light text-brand-green-light hover:bg-brand-green-light hover:text-white focus:ring-brand-green-light',
      outline: 'border-2 border-brand-green-light text-brand-green-light hover:bg-brand-green-light hover:text-white focus:ring-brand-green-light',
      ghost: 'bg-white border border-gray-200 shadow-sm text-brand-gray-dark hover:bg-gray-50 hover:border-gray-300',
      destructive: 'border-2 border-red-600 bg-red-600 hover:bg-red-700 text-white focus:ring-red-600 shadow-sm',
      warning: 'border-2 border-yellow-400 bg-yellow-50 hover:bg-yellow-100 text-yellow-800 shadow-sm',
      add: 'bg-brand-gray-dark hover:bg-brand-gray-deep text-white font-semibold px-4 py-2 text-sm rounded-md',
      iconDestructive: 'bg-transparent border-none text-red-600 hover:text-red-700 hover:bg-red-50 focus:ring-red-600 p-0',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-sm rounded-md',
      md: 'px-4 py-2 text-sm rounded-md',
      lg: 'px-6 py-3 text-base rounded-lg',
    };

    return (
      <button
        className={cn(
          baseClasses,
          variants[variant],
          sizes[size],
          className
        )}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        )}
        {leftIcon && !loading && (
          <span className={children ? "mr-1" : undefined}>{leftIcon}</span>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

/**
 * Variant 'add':
 * Botão de ação primária para adição/criação de itens (ex: Nova Instância, Novo Provedor).
 * Visual: fundo brand-gray-dark, texto branco, fonte semibold, hover brand-gray-deep, padding e borda arredondada.
 * Use variant="add" para todos os botões de adição do sistema para garantir padronização visual.
 */

export { Button };
export type { ButtonProps }; 