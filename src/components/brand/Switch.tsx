import * as RadixSwitch from '@radix-ui/react-switch';
import React from 'react';

interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  id?: string;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export const Switch: React.FC<SwitchProps> = ({ checked, onCheckedChange, id, disabled, className = '', children }) => (
  <div className={`flex items-center gap-2 ${className}`}>
    <RadixSwitch.Root
      checked={checked}
      onCheckedChange={onCheckedChange}
      id={id}
      disabled={disabled}
      className={`w-10 h-6 bg-gray-200 rounded-full relative data-[state=checked]:bg-brand-green-light transition-colors outline-none cursor-pointer ${disabled ? 'opacity-50' : ''}`}
    >
      <RadixSwitch.Thumb className="block w-5 h-5 bg-white rounded-full shadow absolute left-0.5 top-0.5 transition-transform data-[state=checked]:translate-x-4" />
    </RadixSwitch.Root>
    {children && <label htmlFor={id}>{children}</label>}
  </div>
); 