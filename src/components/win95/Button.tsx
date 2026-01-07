import React from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'icon' | 'titlebar';
  pressed?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  className,
  variant = 'default',
  pressed = false,
  disabled,
  ...props
}) => {
  const baseClasses = {
    default: 'win95-button min-w-[75px]',
    icon: 'win95-button p-1 min-w-0',
    titlebar: 'win95-titlebar-btn',
  };

  return (
    <button
      className={cn(
        baseClasses[variant],
        pressed && 'win95-button-pressed',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};
