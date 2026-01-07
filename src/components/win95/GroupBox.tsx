import React from 'react';
import { cn } from '@/lib/utils';

interface GroupBoxProps {
  label: string;
  children: React.ReactNode;
  className?: string;
}

export const GroupBox: React.FC<GroupBoxProps> = ({
  label,
  children,
  className,
}) => {
  return (
    <div className={cn('win95-groupbox', className)}>
      <span className="win95-groupbox-label">{label}</span>
      {children}
    </div>
  );
};
