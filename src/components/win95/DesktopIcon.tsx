import React from 'react';
import { cn } from '@/lib/utils';

interface DesktopIconProps {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  onDoubleClick?: () => void;
  selected?: boolean;
  /** Optional tile background (hex / tailwind color). When set, the icon
   *  renders on a polished 3D plate instead of a flat square. */
  tileColor?: string;
  /** Optional darker shade for the inset shadow on the tile. */
  tileShade?: string;
  /** Optional lighter shade for the inset highlight on the tile. */
  tileHighlight?: string;
}

export const DesktopIcon: React.FC<DesktopIconProps> = ({
  icon,
  label,
  onClick,
  onDoubleClick,
  selected = false,
  tileColor,
  tileShade,
  tileHighlight,
}) => {
  const tileStyle: React.CSSProperties = tileColor
    ? {
        backgroundColor: tileColor,
        boxShadow: `inset -2px -2px 0 ${tileShade ?? 'rgba(0,0,0,0.35)'}, inset 2px 2px 0 ${
          tileHighlight ?? 'rgba(255,255,255,0.55)'
        }`,
      }
    : {};

  return (
    <div
      className={cn('win95-icon group', selected && 'selected')}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
    >
      <div
        className={cn(
          'win95-icon-image flex items-center justify-center transition-transform duration-150 group-hover:-translate-y-0.5',
          tileColor && 'rounded-[3px] w-10 h-10'
        )}
        style={tileStyle}
      >
        {icon}
      </div>
      <span className="win95-icon-label">{label}</span>
    </div>
  );
};
