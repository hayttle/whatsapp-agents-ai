import React from 'react';
import { LucideIcon, Loader2 } from 'lucide-react';

interface ActionButtonProps {
  icon: LucideIcon;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  title?: string;
  className?: string;
}

const variantStyles = {
  primary: 'hover:bg-blue-50 text-blue-600',
  secondary: 'hover:bg-gray-50 text-gray-600',
  danger: 'hover:bg-red-50 text-red-600',
  success: 'hover:bg-green-50 text-green-600',
  warning: 'hover:bg-yellow-50 text-yellow-600',
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

export const ActionButton: React.FC<ActionButtonProps> = ({
  icon: Icon,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  title,
  className = '',
}) => {
  const baseClasses = 'rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
  const variantClass = variantStyles[variant];
  const sizeClass = sizeStyles[size];
  const iconSizeClass = iconSizes[size];
  const disabledClass = (disabled || loading) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer';
  
  const focusRingClass = {
    primary: 'focus:ring-blue-500',
    secondary: 'focus:ring-gray-500',
    danger: 'focus:ring-red-500',
    success: 'focus:ring-green-500',
    warning: 'focus:ring-yellow-500',
  }[variant];

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
        ${focusRingClass}
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