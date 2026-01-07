import React from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Input: React.FC<InputProps> = ({
  className,
  label,
  id,
  ...props
}) => {
  return (
    <div className="flex flex-col gap-0.5">
      {label && (
        <label htmlFor={id} className="text-xs">
          {label}
        </label>
      )}
      <input
        id={id}
        className={cn('win95-input', className)}
        {...props}
      />
    </div>
  );
};

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export const TextArea: React.FC<TextAreaProps> = ({
  className,
  label,
  id,
  ...props
}) => {
  return (
    <div className="flex flex-col gap-0.5">
      {label && (
        <label htmlFor={id} className="text-xs">
          {label}
        </label>
      )}
      <textarea
        id={id}
        className={cn('win95-input resize-none', className)}
        {...props}
      />
    </div>
  );
};

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string | number; label: string }[];
}

export const Select: React.FC<SelectProps> = ({
  className,
  label,
  id,
  options,
  ...props
}) => {
  return (
    <div className="flex flex-col gap-0.5">
      {label && (
        <label htmlFor={id} className="text-xs">
          {label}
        </label>
      )}
      <select
        id={id}
        className={cn('win95-input cursor-pointer', className)}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};
