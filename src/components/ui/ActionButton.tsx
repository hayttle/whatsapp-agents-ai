import React from 'react';
import { LucideIcon, Loader2 } from 'lucide-react';

interface ActionButtonProps {
  icon: LucideIcon;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  title?: string;
  className?: string;
}

const variantStyles = {
  primary: 'bg-brand-green-light hover:bg-brand-green-medium text-white focus:ring-brand-green-light shadow-sm',
  secondary: 'bg-blue-100 hover:bg-blue-200 text-blue-900 shadow-sm',
  outline: 'border-2 border-brand-green-light text-brand-green-light hover:bg-brand-green-light hover:text-white focus:ring-brand-green-light',
  ghost: 'text-brand-gray-dark hover:bg-brand-gray-dark hover:text-white focus:ring-brand-gray-dark',
  destructive: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-600 shadow-sm',
};

const sizeStyles = {
  sm: 'p-1.5',
  md: 'p-2',
  lg: 'p-2.5',
};

const iconSizes = {
  sm: 'w-3.5 h-3.5',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
};

export const ActionButton: React.FC<Omit<ActionButtonProps, 'variant'> & { variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' }> = ({
  icon: Icon,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  title,
  className = '',
}) => {
  const baseClasses = 'rounded-md transition-colors focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed';
  const variantClass = variantStyles[variant];
  const sizeClass = sizeStyles[size];
  const iconSizeClass = iconSizes[size];
  const disabledClass = (disabled || loading) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer';
  
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      title={title}
      className={`
        ${baseClasses}
        ${variantClass}
        ${sizeClass}
        ${disabledClass}
        ${className}
      `.trim()}
    >
      {loading ? (
        <Loader2 className={`${iconSizeClass} animate-spin`} />
      ) : (
        <Icon className={iconSizeClass} />
      )}
    </button>
  );
};

export default ActionButton; 