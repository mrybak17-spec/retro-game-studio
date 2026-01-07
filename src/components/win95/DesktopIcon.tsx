import React from 'react';
import { cn } from '@/lib/utils';

interface DesktopIconProps {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  onDoubleClick?: () => void;
  selected?: boolean;
}

export const DesktopIcon: React.FC<DesktopIconProps> = ({
  icon,
  label,
  onClick,
  onDoubleClick,
  selected = false,
}) => {
  return (
    <div
      className={cn('win95-icon', selected && 'selected')}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
    >
      <div className="win95-icon-image flex items-center justify-center">
        {icon}
      </div>
      <span className="win95-icon-label">{label}</span>
    </div>
  );
};
